import { ToolDefinition } from './aiTypes';

/**
 * SONORA AI Wallet Tool Registry
 *
 * Exposes allowlisted, semantic, read-only or draft-preparation functions to the AI.
 *
 * CRITICAL SECURITY INVARIANT:
 * - NO tools exist for signing transactions.
 * - NO tools exist for accessing private keys or mnemonics.
 * - NO tools exist for submitting transactions to Stellar directly.
 */
export const WALLET_TOOLS: ToolDefinition[] = [
  {
    name: 'getAccountDetails',
    description: 'Retrieve Stellar account details such as public key, sequence number, and subentry count.',
    parameters: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Optional Stellar public key (G...). If omitted, uses active wallet account.',
        },
      },
    },
  },
  {
    name: 'getBalances',
    description: 'Retrieve current native XLM and asset balances for the active Stellar wallet.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getSupportedAssets',
    description: 'List supported assets in SONORA (e.g., Native XLM, USDC testnet asset).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'listContacts',
    description: 'List all verified contacts saved in the wallet with their names and addresses.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'findContact',
    description: 'Search for a contact by name or nickname.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Contact name or nickname to search for.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'addContact',
    description: 'Add a new verified contact with a nickname and validated Stellar address.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Contact nickname or full name.',
        },
        address: {
          type: 'string',
          description: 'Valid Stellar G-address.',
        },
      },
      required: ['name', 'address'],
    },
  },
  {
    name: 'preparePayment',
    description: 'Construct and validate an unsigned Stellar payment draft. Does NOT sign or submit.',
    parameters: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'Stellar G-address or verified contact name.',
        },
        amount: {
          type: 'string',
          description: 'Amount of asset to send (e.g., "10", "5.5").',
        },
        assetCode: {
          type: 'string',
          description: 'Asset code to send, either "XLM" or "USDC". Defaults to XLM.',
        },
        memo: {
          type: 'string',
          description: 'Optional text memo (up to 28 bytes).',
        },
      },
      required: ['recipient', 'amount'],
    },
  },
  {
    name: 'validatePaymentDraft',
    description: 'Check whether a recipient and amount are valid and whether balance covers amount + reserve + fee.',
    parameters: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'Recipient address or contact name.',
        },
        amount: {
          type: 'string',
          description: 'Payment amount.',
        },
        assetCode: {
          type: 'string',
          description: 'Asset code (XLM or USDC).',
        },
      },
      required: ['recipient', 'amount'],
    },
  },
  {
    name: 'getReceivingAddress',
    description: 'Get the active wallet public Stellar G-address for receiving funds.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'createPaymentRequest',
    description: 'Generate payment request details with amount, asset, and wallet address.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          description: 'Requested amount.',
        },
        assetCode: {
          type: 'string',
          description: 'Asset code requested.',
        },
        memo: {
          type: 'string',
          description: 'Optional requested memo.',
        },
      },
    },
  },
  {
    name: 'getTransactionHistory',
    description: 'Retrieve recent Stellar transactions and payments for the active account.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of transactions to return (default 5, max 20).',
        },
      },
    },
  },
  {
    name: 'getTransactionDetails',
    description: 'Retrieve detailed information for a specific transaction by hash.',
    parameters: {
      type: 'object',
      properties: {
        hash: {
          type: 'string',
          description: '64-character transaction hash.',
        },
      },
      required: ['hash'],
    },
  },
  {
    name: 'getNetworkStatus',
    description: 'Check the connection status and current ledger height of Stellar Testnet.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getUserPreferences',
    description: 'Retrieve accessibility preferences such as speech rate, pitch, and high contrast.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'updateUserPreference',
    description: 'Update a user accessibility preference.',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Preference key (e.g. "speechRate", "highContrast").',
        },
        value: {
          type: 'string',
          description: 'New value for the preference.',
        },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'updateSpeechSpeed',
    description: 'Adjust Text-to-Speech playback speed (e.g., 0.8 for slower, 1.0 for normal, 1.2 for faster).',
    parameters: {
      type: 'object',
      properties: {
        speed: {
          type: 'number',
          description: 'Speech rate between 0.5 and 2.0.',
        },
      },
      required: ['speed'],
    },
  },
  {
    name: 'repeatLastResponse',
    description: 'Re-speak the last assistant response or error explanation.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getContextualHelp',
    description: 'Get spoken help explanation relevant to the current screen or workflow.',
    parameters: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Current context or workflow name.',
        },
      },
    },
  },
  {
    name: 'getSecurityStatus',
    description: 'Check biometric availability, device security, and wallet encryption status.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
