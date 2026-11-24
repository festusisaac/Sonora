# SONORA — Phase 4: AI Wallet Tool Registry Reference

## 1. Registry Design & Security Model

The Tool Registry (`src/services/ai/toolRegistry.ts`) provides a strictly typed, schema-validated bridge between the AI Companion and the Stellar wallet services.

```
                           +------------------------+
                           |  SonoraAIOrchestrator  |
                           +------------------------+
                                        |
                             (Tool Call Request)
                                        v
                           +------------------------+
                           |     ToolDispatcher     |
                           |  [Forbidden Check]     |
                           |  [Allowlist Check]     |
                           +------------------------+
                                        |
                 +----------------------+----------------------+
                 |                      |                      |
                 v                      v                      v
        Stellar Services         Contact Service         Device / System
      - Account & Balance      - List Contacts         - Speech Rate
      - Fee & Reserves         - Add Contact           - Screen Reader Help
      - Payment Draft Builder  - Disambiguation        - Security Status
```

---

## 2. Allowlisted Tools Specification

| Tool Name | Parameters | Return Values | Description |
|-----------|------------|---------------|-------------|
| `getAccountDetails` | `publicKey?` | Account ID, sequence, subentries | Fetches public Stellar account details |
| `getBalances` | None | `nativeBalance`, `availableNativeBalance`, `assetBalances` | Calculates spendable balances after minimum reserves |
| `getSupportedAssets` | None | Supported asset identifiers (XLM, USDC) | Lists supported Stellar assets |
| `listContacts` | None | `contacts`, `count` | Retrieves verified local address book |
| `findContact` | `query: string` | `matches`, `count` | Searches contacts by nickname |
| `addContact` | `name: string`, `address: string` | `success`, `contact` | Validates Stellar address and saves nickname |
| `preparePayment` | `recipient`, `amount`, `assetCode?`, `memo?` | `transactionHash`, `fee`, `unsignedXdr`, `recipient`, `amount` | Prepares unsigned draft; flags ambiguous recipients |
| `validatePaymentDraft` | `recipient`, `amount`, `assetCode?` | Validation success/error | Pre-flight validation against balance |
| `getReceivingAddress` | None | `publicKey`, `displayAddress`, `qrPayload` | Returns user's Stellar public address |
| `createPaymentRequest` | `amount?`, `assetCode?`, `memo?` | URI payload with SEP-0007 format | Generates shareable payment request URI |
| `getTransactionHistory` | `limit?: number` | `history`, `count` | Returns recent payments from Testnet Horizon |
| `getTransactionDetails` | `hash: string` | Transaction status, fee, memo, timestamps | Fetches specific transaction details by hash |
| `getNetworkStatus` | None | Network passphrase, horizon version, ledger | Live Stellar Testnet health check |
| `getUserPreferences` | None | `speechRate`, `highContrast` | Retrieves local accessibility preferences |
| `updateUserPreference` | `key: string`, `value: string` | Success confirmation | Saves accessibility preference |
| `updateSpeechSpeed` | `speed: number` (0.5 to 2.0) | `speechRate` | Modifies TTS speech playback speed |
| `repeatLastResponse` | None | Action payload | Triggers re-speaking of previous turn |
| `getContextualHelp` | `context?: string` | `helpText` | Contextual TalkBack guidance |
| `getSecurityStatus` | None | `isDeviceSecure`, `hasBiometrics`, `enrolled` | Queries hardware authentication capabilities |

---

## 3. Forbidden Tool Blocklist

The following methods are explicitly prohibited and blocked at runtime:
- `signTransaction` / `signPayment`
- `submitTransaction` / `submitPayment`
- `exportPrivateKey` / `getPrivateKey`
- `getRecoveryPhrase` / `exportSeed`
- `bypassAuthentication`
- `authorizeTransaction`
