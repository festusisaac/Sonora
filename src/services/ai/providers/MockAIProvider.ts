import {
  AIProvider,
} from './AIProvider';
import {
  ConversationTurn,
  ToolDefinition,
  AIResponse,
  AIToolCall,
} from '../aiTypes';

/**
 * MockAIProvider
 *
 * Provides intelligent, deterministic local responses and simulated tool calls.
 * Used for development, testing, and offline fallback.
 * Strictly enforces non-custodial invariants: never attempts key retrieval or signing.
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'MockAIProvider';

  isConfigured(): boolean {
    return true;
  }

  async generateResponse(
    messages: ConversationTurn[],
    tools: ToolDefinition[],
    context?: Record<string, unknown>
  ): Promise<AIResponse> {
    const lastUserTurn = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    const prompt = (lastUserTurn?.content || '').trim().toLowerCase();

    // Check balance intent
    if (
      prompt.includes('balance') ||
      prompt.includes('how much') ||
      prompt.includes('funds') ||
      prompt.includes('money')
    ) {
      const toolCall: AIToolCall = {
        id: `mock-call-${Date.now()}-1`,
        name: 'getBalances',
        parameters: {},
      };
      return {
        text: 'Checking your Stellar balance now.',
        toolCalls: [toolCall],
        intent: 'check_balance',
        suggestedQuickReplies: ['Send XLM', 'My Address', 'Transaction History'],
      };
    }

    // Receive address intent
    if (
      prompt.includes('receive') ||
      prompt.includes('receiving') ||
      prompt.includes('address') ||
      prompt.includes('public key') ||
      prompt.includes('qr code')
    ) {
      const toolCall: AIToolCall = {
        id: `mock-call-${Date.now()}-2`,
        name: 'getReceivingAddress',
        parameters: {},
      };
      return {
        text: 'Fetching your Stellar receiving address.',
        toolCalls: [toolCall],
        intent: 'receive_funds',
        suggestedQuickReplies: ['Check Balance', 'Copy Address'],
      };
    }

    // List contacts intent
    if (
      (prompt.includes('contact') && (prompt.includes('list') || prompt.includes('show') || prompt.includes('who'))) ||
      prompt === 'contacts'
    ) {
      const toolCall: AIToolCall = {
        id: `mock-call-${Date.now()}-3`,
        name: 'listContacts',
        parameters: {},
      };
      return {
        text: 'Loading your saved contacts.',
        toolCalls: [toolCall],
        intent: 'list_contacts',
        suggestedQuickReplies: ['Send XLM', 'Add Contact'],
      };
    }

    // Transaction history intent
    if (
      prompt.includes('history') ||
      prompt.includes('recent') ||
      prompt.includes('transactions') ||
      prompt.includes('activity')
    ) {
      const toolCall: AIToolCall = {
        id: `mock-call-${Date.now()}-4`,
        name: 'getTransactionHistory',
        parameters: { limit: 5 },
      };
      return {
        text: 'Fetching your recent Stellar transactions.',
        toolCalls: [toolCall],
        intent: 'view_history',
        suggestedQuickReplies: ['Check Balance', 'Send XLM'],
      };
    }

    // Send payment intent
    if (
      prompt.includes('send') ||
      prompt.includes('pay') ||
      prompt.includes('transfer')
    ) {
      // Check if details are present in context or prompt
      return {
        text: 'I can help you send a payment. Who would you like to pay and how much?',
        intent: 'send_payment',
        suggestedQuickReplies: ['Send to Amina', 'Send 5 XLM', 'Cancel'],
      };
    }

    // Help intent
    if (
      prompt.includes('help') ||
      prompt.includes('what can you do') ||
      prompt.includes('commands')
    ) {
      return {
        text: 'I am SONORA, your voice wallet companion. You can ask me to check your balance, send payments, show your receiving address, list your contacts, or review your transaction history.',
        intent: 'help',
        suggestedQuickReplies: ['Check Balance', 'Send Money', 'Contacts', 'My Address'],
      };
    }

    // Default conversational response
    return {
      text: "I didn't quite catch that. You can say 'Check balance', 'Send XLM', 'My address', or 'Help'.",
      intent: 'unknown',
      suggestedQuickReplies: ['Check Balance', 'Send Money', 'Help'],
    };
  }
}
