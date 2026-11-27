import { AIToolCall, AIToolResult } from './aiTypes';
import { WALLET_TOOLS } from './toolRegistry';
import { StellarAccountService } from '../stellar/stellarAccountService';
import { StellarBalanceService } from '../stellar/stellarBalanceService';
import { StellarAssetService } from '../stellar/stellarAssetService';
import { StellarTransactionBuilderService } from '../stellar/stellarTransactionBuilder';
import { StellarTransactionValidator } from '../stellar/stellarTransactionValidator';
import { StellarTransactionHistoryService } from '../stellar/stellarTransactionHistoryService';
import { validateStellarAddress } from '../stellar/validation';
import { ContactService } from '../contacts/contactService';
import { DeviceAuthenticationService } from '../security/deviceAuthenticationService';
import { LocalPreferencesService } from '../storage/localStorage';
import { getHorizonServer } from '../stellar/client';
import { AssetIdentifier, MemoDetails } from '../../types/transaction.types';
import { stroopsToDecimal } from '../../utils/stroop';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { WalletCreationService } from '../wallet/walletCreationService';
import { StellarTestnetFundingService } from '../stellar/stellarTestnetFundingService';

/**
 * Forbidden Tools Blocklist
 * Explicitly prohibited from ever being registered or invoked by the AI.
 */
const FORBIDDEN_TOOLS = new Set([
  'signtransaction',
  'signpayment',
  'submittransaction',
  'submitpayment',
  'exportprivatekey',
  'getrecoveryphrase',
  'exportseed',
  'getprivatekey',
  'getseed',
  'bypassauthentication',
  'authorizetransaction',
]);

const ALLOWED_TOOL_NAMES = new Set(WALLET_TOOLS.map((t) => t.name.toLowerCase()));

export class ToolDispatcher {
  /**
   * Execute an AI Tool Call safely within non-custodial boundaries.
   */
  public static async executeToolCall(
    toolCall: AIToolCall,
    activePublicKey?: string | null
  ): Promise<AIToolResult> {
    const normalizedName = toolCall.name.trim().toLowerCase();

    // 1. Enforce strict forbidden tool check
    if (FORBIDDEN_TOOLS.has(normalizedName)) {
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        error: `SECURITY_VIOLATION: Tool '${toolCall.name}' is strictly prohibited. AI cannot access keys or sign transactions.`,
      };
    }

    // 2. Enforce allowlist check
    if (!ALLOWED_TOOL_NAMES.has(normalizedName)) {
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        error: `UNAUTHORIZED_TOOL: Tool '${toolCall.name}' is not in the allowlisted tool registry.`,
      };
    }

    try {
      const result = await this.dispatch(toolCall, activePublicKey);
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        result,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        error: message,
      };
    }
  }

  private static async dispatch(
    toolCall: AIToolCall,
    activePublicKey?: string | null
  ): Promise<unknown> {
    const params = toolCall.parameters || {};

    switch (toolCall.name) {
      case 'createWallet': {
        const creation = await WalletCreationService.createWallet();
        let funded = false;
        try {
          const fundRes = await StellarTestnetFundingService.fundAccount(creation.publicKey);
          funded = Boolean(fundRes.success);
        } catch {
          // Funding can be retried if Friendbot is congested
        }
        const wStore = useWalletStore.getState();
        wStore.setPublicKey(creation.publicKey);
        wStore.setBackedUp(false);
        if (funded) {
          wStore.setBalances([
            {
              code: 'XLM',
              balance: '10000.0000000',
            },
          ]);
        }
        return {
          success: true,
          publicKey: creation.publicKey,
          funded,
        };
      }
      case 'getAccountDetails': {
        const pubKey = (params.publicKey as string) || activePublicKey;
        if (!pubKey) {
          throw new Error('No active wallet account found.');
        }
        return await StellarAccountService.getAccountInfo(pubKey);
      }

      case 'getBalances': {
        if (!activePublicKey) {
          throw new Error('No active wallet account found. Please create or restore a wallet first.');
        }
        const accountInfo = await StellarAccountService.getAccountInfo(activePublicKey);
        if (!accountInfo) {
          return {
            publicKey: activePublicKey,
            nativeBalance: '0',
            availableNativeBalance: '0',
            assetBalances: [],
          };
        }
        const reserves = StellarBalanceService.calculateAccountReserves(accountInfo);
        const assetBalances = accountInfo.balances
          .filter((b) => b.asset_type !== 'native')
          .map((b) => ({
            assetCode: b.asset_code || 'UNKNOWN',
            balance: b.balance,
          }));

        return {
          publicKey: activePublicKey,
          nativeBalance: reserves.totalXlm,
          availableNativeBalance: reserves.availableXlm,
          assetBalances,
        };
      }

      case 'getSupportedAssets': {
        return StellarAssetService.getSupportedAssets();
      }

      case 'listContacts': {
        const contacts = await ContactService.getContacts();
        return { contacts, count: contacts.length };
      }

      case 'findContact': {
        const query = String(params.query || '');
        const matches = await ContactService.findContacts(query);
        return { query, matches, count: matches.length };
      }

      case 'addContact': {
        const name = String(params.name || '');
        const address = String(params.address || '');
        const contact = await ContactService.addContact(name, address);
        return { success: true, contact };
      }

      case 'preparePayment': {
        if (!activePublicKey) {
          throw new Error('No active wallet connected.');
        }

        const rawRecipient = String(params.recipient || '').trim();
        const amount = String(params.amount || '').trim();
        const assetCode = (String(params.assetCode || 'XLM').toUpperCase()) as 'XLM' | 'USDC';
        const memo = params.memo ? String(params.memo).trim() : undefined;

        if (!rawRecipient) throw new Error('Recipient is required.');
        if (!amount) throw new Error('Amount is required.');

        // Resolve recipient: either a direct G-address or a contact nickname
        let destinationAddress = rawRecipient;
        let resolvedContactName: string | undefined = undefined;

        if (!rawRecipient.startsWith('G') || rawRecipient.length !== 56) {
          const matching = await ContactService.findContacts(rawRecipient);
          if (matching.length === 0) {
            throw new Error(`Recipient "${rawRecipient}" is neither a valid Stellar G-address nor a saved contact.`);
          }
          if (matching.length > 1) {
            return {
              status: 'AMBIGUOUS_RECIPIENT',
              candidates: matching.map((c, i) => ({
                id: c.id,
                name: c.name,
                address: c.address,
                index: i + 1,
              })),
              message: `Found ${matching.length} contacts matching "${rawRecipient}". Please specify which one.`,
            };
          }
          destinationAddress = matching[0].address;
          resolvedContactName = matching[0].name;
        } else {
          // If a direct G-address was provided, check if it matches a saved contact
          const knownContacts = await ContactService.getContacts();
          const match = knownContacts.find(
            (c) => c.address.toUpperCase() === destinationAddress.toUpperCase()
          );
          if (match) {
            resolvedContactName = match.name;
          }
        }

        // Validate recipient address format
        const recipientValidation = validateStellarAddress(destinationAddress);
        if (!recipientValidation.isValid) {
          throw new Error(`Invalid recipient address: ${recipientValidation.error}`);
        }

        const assetIdent: AssetIdentifier =
          assetCode === 'USDC'
            ? {
                code: 'USDC',
                isNative: false,
                issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
              }
            : { code: 'XLM', isNative: true };

        const memoDetails: MemoDetails = memo ? { type: 'text', value: memo } : { type: 'none' };

        // Validate payment draft against current balance
        const validation = await StellarTransactionValidator.validatePayment({
          sourceAddress: activePublicKey,
          destinationAddress,
          asset: assetIdent,
          amount,
          memo: memoDetails,
        });

        if (!validation.isValid) {
          throw new Error(`Payment validation failed: ${validation.error}`);
        }

        // Build unsigned transaction draft
        const unsignedDraft = await StellarTransactionBuilderService.preparePaymentTransaction({
          sourceAddress: activePublicKey,
          destinationAddress,
          asset: assetIdent,
          amount,
          memo: memoDetails,
          recipientLabel: resolvedContactName,
        });

        // Store into transaction store for seamless UI authorization
        useTransactionStore.getState().setPreparedTransaction(unsignedDraft);

        const feeInXlm = stroopsToDecimal(BigInt(unsignedDraft.estimatedFeeStroops));

        return {
          status: 'DRAFT_PREPARED',
          transactionHash: unsignedDraft.transactionHash,
          recipient: destinationAddress,
          recipientName: resolvedContactName,
          amount,
          assetCode,
          fee: feeInXlm,
          memo: memo || null,
          unsignedXdr: unsignedDraft.unsignedXdr,
          notice: 'Draft prepared. Explicit user review and authorization required.',
        };
      }

      case 'validatePaymentDraft': {
        if (!activePublicKey) {
          throw new Error('No active wallet connected.');
        }
        const recipient = String(params.recipient || '').trim();
        const amount = String(params.amount || '').trim();
        const assetCode = (String(params.assetCode || 'XLM').toUpperCase()) as 'XLM' | 'USDC';

        const assetIdent: AssetIdentifier =
          assetCode === 'USDC'
            ? {
                code: 'USDC',
                isNative: false,
                issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
              }
            : { code: 'XLM', isNative: true };

        return await StellarTransactionValidator.validatePayment({
          sourceAddress: activePublicKey,
          destinationAddress: recipient,
          asset: assetIdent,
          amount,
        });
      }

      case 'getReceivingAddress': {
        if (!activePublicKey) {
          throw new Error('No active wallet connected.');
        }
        return {
          publicKey: activePublicKey,
          displayAddress: activePublicKey,
          qrPayload: `stellar:${activePublicKey}`,
        };
      }

      case 'createPaymentRequest': {
        if (!activePublicKey) {
          throw new Error('No active wallet connected.');
        }
        const amount = params.amount ? String(params.amount) : undefined;
        const assetCode = params.assetCode ? String(params.assetCode).toUpperCase() : 'XLM';
        const memo = params.memo ? String(params.memo) : undefined;

        let uri = `web+stellar:pay?destination=${activePublicKey}`;
        if (amount) uri += `&amount=${encodeURIComponent(amount)}`;
        if (assetCode && assetCode !== 'XLM') uri += `&asset_code=${encodeURIComponent(assetCode)}`;
        if (memo) uri += `&memo=${encodeURIComponent(memo)}&memo_type=MEMO_TEXT`;

        return {
          publicKey: activePublicKey,
          amount,
          assetCode,
          memo,
          uri,
        };
      }

      case 'getTransactionHistory': {
        if (!activePublicKey) {
          throw new Error('No active wallet connected.');
        }
        const limit = typeof params.limit === 'number' ? Math.min(params.limit, 20) : 5;
        const page = await StellarTransactionHistoryService.getAccountPaymentHistory(activePublicKey, { limit });
        return {
          history: page.items,
          count: page.items.length,
        };
      }

      case 'getTransactionDetails': {
        const hash = String(params.hash || '').trim();
        if (!hash || hash.length !== 64) {
          throw new Error('Valid 64-character transaction hash is required.');
        }
        return await StellarTransactionHistoryService.getTransactionDetails(hash);
      }

      case 'getNetworkStatus': {
        const server = getHorizonServer();
        const root = await server.root();
        return {
          network: 'Stellar Testnet',
          horizonVersion: root.horizon_version,
          networkPassphrase: root.network_passphrase,
          currentLedger: root.core_latest_ledger,
          online: true,
        };
      }

      case 'getUserPreferences': {
        const speechRate = await LocalPreferencesService.getPreference('speech_rate', 1.0);
        const highContrast = await LocalPreferencesService.getPreference('high_contrast', true);
        return { speechRate, highContrast };
      }

      case 'updateUserPreference': {
        const key = String(params.key || '');
        const value = params.value;
        await LocalPreferencesService.setPreference(key, value);
        return { success: true, key, value };
      }

      case 'updateSpeechSpeed': {
        const speed = Number(params.speed);
        if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
          throw new Error('Speech speed must be a number between 0.5 and 2.0.');
        }
        await LocalPreferencesService.setPreference('speech_rate', speed);
        return { success: true, speechRate: speed };
      }

      case 'repeatLastResponse': {
        return { action: 'REPEAT_LAST_RESPONSE' };
      }

      case 'getContextualHelp': {
        const context = String(params.context || 'general');
        return {
          context,
          helpText: 'SONORA allows you to control your Stellar wallet with your voice. You can check your balance, view receiving address, list contacts, or send funds by speaking clearly.',
        };
      }

      case 'getSecurityStatus': {
        const authStatus = await DeviceAuthenticationService.getStatus();
        return {
          isDeviceSecure: authStatus.hasHardware,
          hasBiometrics: authStatus.hasHardware,
          biometryType: authStatus.supportedTypes.join(', ') || 'None',
          enrolled: authStatus.isEnrolled,
        };
      }

      default:
        throw new Error(`Unhandled tool implementation for '${toolCall.name}'.`);
    }
  }
}
