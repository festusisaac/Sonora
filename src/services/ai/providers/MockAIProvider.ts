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
 * Provides conversational local responses, smart greetings, and simulated tool calls.
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

    // 1. Natural Greetings & Social Interaction
    if (
      prompt === 'hello' ||
      prompt === 'hi' ||
      prompt.startsWith('hello') ||
      prompt.startsWith('hi ') ||
      prompt.startsWith('hey') ||
      prompt.includes('how far') ||
      prompt.includes('good morning') ||
      prompt.includes('good afternoon') ||
      prompt.includes('good evening')
    ) {
      return {
        text: "Hello! I'm SONORA, your voice wallet companion. I'm here and listening. Would you like to check your balance, send funds, or see your receiving address?",
        intent: 'greeting',
        suggestedQuickReplies: ['Check Balance', 'Send XLM', 'My Address'],
      };
    }

    if (
      prompt.includes('how are you') ||
      prompt.includes('how you doing') ||
      prompt.includes('how body')
    ) {
      return {
        text: "I'm doing great, thank you! Your Stellar wallet is ready to go. What can I do for you today?",
        intent: 'greeting',
        suggestedQuickReplies: ['Check Balance', 'Send XLM'],
      };
    }

    if (
      prompt.includes('who are you') ||
      prompt.includes('what are you') ||
      prompt.includes('what is sonora')
    ) {
      return {
        text: "I am SONORA, your voice-operated Stellar crypto wallet companion. I'm designed so you can manage your funds and make transactions completely through natural spoken conversation.",
        intent: 'help',
        suggestedQuickReplies: ['Check Balance', 'Help Me Send', 'My Address'],
      };
    }

    if (
      prompt.includes('thank you') ||
      prompt.includes('thanks') ||
      prompt.includes('appreciate') ||
      prompt.includes('daalu') ||
      prompt.includes('nagode') ||
      prompt.includes('ese')
    ) {
      return {
        text: "You're very welcome! I'm always here whenever you need to check your money or make a transfer.",
        intent: 'general_query',
        suggestedQuickReplies: ['Check Balance', 'Finished'],
      };
    }

    // 2. Crypto Education / Clarification
    if (
      prompt.includes('what is xlm') ||
      prompt.includes('what is lumen') ||
      prompt.includes('what is stellar')
    ) {
      return {
        text: 'Stellar is a fast, low-cost decentralized payment network. XLM, also called Lumens, is the native currency of Stellar, used to pay tiny network fees and transfer value globally in seconds.',
        intent: 'general_query',
        suggestedQuickReplies: ['Check Balance', 'Send XLM'],
      };
    }

    // 3. Check balance intent
    if (
      prompt.includes('balance') ||
      prompt.includes('how much') ||
      prompt.includes('funds') ||
      prompt.includes('money') ||
      prompt.includes('wetin dey')
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

    // 4. Receive address intent
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

    // 5. List contacts intent
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

    // 6. Transaction history intent
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

    // 7. Send payment intent
    if (
      prompt.includes('send') ||
      prompt.includes('pay') ||
      prompt.includes('transfer')
    ) {
      return {
        text: 'I can help you send a payment. Who would you like to pay and how much?',
        intent: 'send_payment',
        suggestedQuickReplies: ['Send to Amina', 'Send 5 XLM', 'Cancel'],
      };
    }

    // 8. Help intent
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

    // 9. Friendly fallback response
    return {
      text: "I'm listening! You can ask me to check your balance, send Lumens, show your address, or ask any question about your wallet.",
      intent: 'general_query',
      suggestedQuickReplies: ['Check Balance', 'Send Money', 'Help'],
    };
  }
}
