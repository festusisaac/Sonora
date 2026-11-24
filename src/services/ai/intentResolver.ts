import { AIIntent } from './aiTypes';

export interface ExtractedEntities {
  amount?: string;
  asset?: 'XLM' | 'USDC';
  recipient?: string;
  memo?: string;
  choiceIndex?: number;
  speechSpeed?: number;
}

export interface IntentResolutionResult {
  intent: AIIntent;
  confidence: number;
  entities: ExtractedEntities;
  rawText: string;
}

const WORD_TO_NUMBER: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  fifteen: '15',
  twenty: '20',
  fifty: '50',
  hundred: '100',
};

export class IntentResolver {
  /**
   * Deterministically resolve intent and extract entities from spoken or typed input.
   * Supports standard English and common Nigerian English colloquial patterns.
   */
  public static resolve(input: string): IntentResolutionResult {
    const rawText = input.trim();
    const text = rawText.toLowerCase();

    // 1. Direct Stop / Silence / Quiet commands
    if (
      text === 'stop' ||
      text === 'quiet' ||
      text === 'shut up' ||
      text === 'hush' ||
      text === 'silence' ||
      text === 'oya stop'
    ) {
      return { intent: 'stop', confidence: 1.0, entities: {}, rawText };
    }

    // 2. Cancellation commands
    if (
      text === 'cancel' ||
      text === 'abort' ||
      text === 'never mind' ||
      text === 'forget it' ||
      text === 'forget am' ||
      text === 'abeg cancel' ||
      text === 'stop payment' ||
      text.includes('cancel payment') ||
      text.includes('cancel this')
    ) {
      return { intent: 'cancel', confidence: 1.0, entities: {}, rawText };
    }

    // 3. Repeat commands
    if (
      text === 'repeat' ||
      text === 'say that again' ||
      text === 'say again' ||
      text === 'come again' ||
      text === 'pardon' ||
      text === 'repeat that' ||
      text.includes('what did you say')
    ) {
      return { intent: 'repeat', confidence: 1.0, entities: {}, rawText };
    }

    // 4. Help commands
    if (
      text === 'help' ||
      text === 'what can you do' ||
      text === 'commands' ||
      text === 'what can i say' ||
      text === 'how does this work' ||
      text.includes('wetin you fit do') ||
      text.includes('help me')
    ) {
      return { intent: 'help', confidence: 1.0, entities: {}, rawText };
    }

    // 5. Speech rate adjustment
    if (
      text.includes('speak slower') ||
      text.includes('talk slow') ||
      text.includes('too fast') ||
      text.includes('reduce speed')
    ) {
      return {
        intent: 'adjust_speech',
        confidence: 0.95,
        entities: { speechSpeed: 0.8 },
        rawText,
      };
    }
    if (
      text.includes('speak faster') ||
      text.includes('talk fast') ||
      text.includes('increase speed')
    ) {
      return {
        intent: 'adjust_speech',
        confidence: 0.95,
        entities: { speechSpeed: 1.2 },
        rawText,
      };
    }

    // 6. Choice / Disambiguation confirmation
    // e.g. "option 1", "number 2", "first one", "second", "yes", "confirm", "proceed", "send am"
    const choiceMatch = this.extractChoice(text);
    if (choiceMatch !== undefined) {
      return {
        intent: 'confirm_choice',
        confidence: 0.9,
        entities: { choiceIndex: choiceMatch },
        rawText,
      };
    }

    // 7. Check Balance inquiries
    if (
      text.includes('balance') ||
      text.includes('how much') ||
      text.includes('how many xlm') ||
      text.includes('wetin dey inside') ||
      text.includes('wetin be my balance') ||
      text.includes('my funds') ||
      text.includes('check wallet')
    ) {
      return { intent: 'check_balance', confidence: 0.95, entities: {}, rawText };
    }

    // 8. Receive / Address inquiries
    if (
      text.includes('receiv') ||
      text.includes('address') ||
      text.includes('public key') ||
      text.includes('qr code') ||
      text.includes('deposit')
    ) {
      return { intent: 'receive_funds', confidence: 0.95, entities: {}, rawText };
    }

    // 9. Transaction history
    if (
      text.includes('history') ||
      text.includes('recent transactions') ||
      text.includes('past transactions') ||
      text.includes('activity') ||
      text.includes('wetin i spend') ||
      text.includes('last payment')
    ) {
      return { intent: 'view_history', confidence: 0.9, entities: {}, rawText };
    }

    // 10. Add contact
    if (
      (text.includes('add contact') || text.includes('save contact') || text.includes('new contact')) &&
      text.includes('g')
    ) {
      const parts = text.split(' ');
      const gIndex = parts.findIndex((p) => p.startsWith('g') && p.length === 56);
      if (gIndex !== -1) {
        const address = parts[gIndex].toUpperCase();
        const nameParts = parts.filter(
          (p, idx) =>
            idx !== gIndex &&
            !['add', 'contact', 'save', 'new', 'as', 'with', 'address', 'named'].includes(p)
        );
        const name = nameParts.join(' ').trim();
        return {
          intent: 'add_contact',
          confidence: 0.9,
          entities: { recipient: address, memo: name },
          rawText,
        };
      }
    }

    // 11. List / Find Contacts
    if (
      text === 'contacts' ||
      text.includes('my contacts') ||
      text.includes('list contacts') ||
      text.includes('show contacts') ||
      text.includes('who dey my contact')
    ) {
      return { intent: 'list_contacts', confidence: 0.9, entities: {}, rawText };
    }

    // 12. Send payment intent & entity extraction
    if (
      text.includes('send') ||
      text.includes('pay') ||
      text.includes('transfer') ||
      text.includes('give')
    ) {
      const entities = this.extractPaymentEntities(text);
      return {
        intent: 'send_payment',
        confidence: 0.95,
        entities,
        rawText,
      };
    }

    // Fallback: check if user just answered with an amount or recipient during a flow
    const entities = this.extractPaymentEntities(text);
    if (entities.amount || entities.recipient) {
      return {
        intent: 'send_payment',
        confidence: 0.7,
        entities,
        rawText,
      };
    }

    return {
      intent: 'unknown',
      confidence: 0.2,
      entities: {},
      rawText,
    };
  }

  private static extractChoice(text: string): number | undefined {
    if (text === 'yes' || text === 'confirm' || text === 'proceed' || text === 'send am' || text === 'continue') {
      return 1;
    }
    if (text === 'first' || text === 'first one' || text === 'option 1' || text === 'number 1' || text === '1') {
      return 1;
    }
    if (text === 'second' || text === 'second one' || text === 'option 2' || text === 'number 2' || text === '2') {
      return 2;
    }
    if (text === 'third' || text === 'third one' || text === 'option 3' || text === 'number 3' || text === '3') {
      return 3;
    }
    return undefined;
  }

  private static extractPaymentEntities(text: string): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // 1. Asset extraction
    if (text.includes('usdc') || text.includes('dollar') || text.includes('dollars')) {
      entities.asset = 'USDC';
    } else {
      entities.asset = 'XLM';
    }

    // 2. Amount extraction
    // Match numeric formats like "10", "5.5", "0.25"
    const numberMatch = text.match(/\b\d+(\.\d+)?\b/);
    if (numberMatch) {
      entities.amount = numberMatch[0];
    } else {
      // Check written word numbers
      for (const [word, num] of Object.entries(WORD_TO_NUMBER)) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(text)) {
          entities.amount = num;
          break;
        }
      }
    }

    // 3. Memo extraction
    const memoMatch = text.match(/\b(memo|with memo|saying)\s+([a-zA-Z0-9_\-\s]+)$/i);
    if (memoMatch && memoMatch[2]) {
      entities.memo = memoMatch[2].trim().slice(0, 28);
    }

    // 4. Recipient extraction
    // Look for G-address
    const gAddressMatch = text.match(/\b(G[A-Z0-9]{55})\b/i);
    if (gAddressMatch) {
      entities.recipient = gAddressMatch[1].toUpperCase();
    } else {
      // Strip memo part before matching recipient
      const textWithoutMemo = text.replace(/\b(memo|with\s+memo|saying)\b.*$/i, '').trim();
      const toMatch = textWithoutMemo.match(/\b(?:to|give|pay)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
      if (toMatch && toMatch[1]) {
        const candidate = toMatch[1].trim();
        const stopWords = ['send', 'pay', 'transfer', 'xlm', 'lumens', 'usdc', 'dollars', 'the', 'some', 'my', 'with'];
        const words = candidate.split(/\s+/).filter((w) => !stopWords.includes(w.toLowerCase()));
        if (words.length > 0) {
          const capitalized = words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
          entities.recipient = capitalized;
        }
      }
    }

    return entities;
  }
}
