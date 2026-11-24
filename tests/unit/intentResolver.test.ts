import { IntentResolver } from '../../src/services/ai/intentResolver';

describe('Intent Resolver & Entity Extractor', () => {
  describe('Control and Accessibility Commands', () => {
    test('resolves stop and quiet commands with high confidence', () => {
      const inputs = ['stop', 'quiet', 'shut up', 'hush', 'oya stop', 'silence'];
      for (const input of inputs) {
        const res = IntentResolver.resolve(input);
        expect(res.intent).toBe('stop');
        expect(res.confidence).toBe(1.0);
      }
    });

    test('resolves cancellation commands across standard and Nigerian English', () => {
      const inputs = [
        'cancel',
        'abort',
        'never mind',
        'forget it',
        'forget am',
        'abeg cancel',
        'cancel payment',
      ];
      for (const input of inputs) {
        const res = IntentResolver.resolve(input);
        expect(res.intent).toBe('cancel');
        expect(res.confidence).toBe(1.0);
      }
    });

    test('resolves repeat commands', () => {
      const inputs = ['repeat', 'say that again', 'say again', 'come again', 'pardon', 'what did you say'];
      for (const input of inputs) {
        const res = IntentResolver.resolve(input);
        expect(res.intent).toBe('repeat');
      }
    });

    test('resolves speech speed adjustments', () => {
      const slow = IntentResolver.resolve('speak slower please');
      expect(slow.intent).toBe('adjust_speech');
      expect(slow.entities.speechSpeed).toBe(0.8);

      const fast = IntentResolver.resolve('talk faster');
      expect(fast.intent).toBe('adjust_speech');
      expect(fast.entities.speechSpeed).toBe(1.2);
    });

    test('resolves contextual help commands', () => {
      const inputs = ['help', 'what can you do', 'commands', 'what can i say', 'wetin you fit do'];
      for (const input of inputs) {
        const res = IntentResolver.resolve(input);
        expect(res.intent).toBe('help');
      }
    });

    test('resolves choice confirmations and options', () => {
      expect(IntentResolver.resolve('yes').intent).toBe('confirm_choice');
      expect(IntentResolver.resolve('confirm').intent).toBe('confirm_choice');
      expect(IntentResolver.resolve('proceed').intent).toBe('confirm_choice');
      expect(IntentResolver.resolve('send am').intent).toBe('confirm_choice');

      const opt1 = IntentResolver.resolve('option 1');
      expect(opt1.intent).toBe('confirm_choice');
      expect(opt1.entities.choiceIndex).toBe(1);

      const opt2 = IntentResolver.resolve('second one');
      expect(opt2.intent).toBe('confirm_choice');
      expect(opt2.entities.choiceIndex).toBe(2);
    });
  });

  describe('Financial Inquiries & Balance Checks', () => {
    test('resolves balance inquiries across standard and Nigerian English', () => {
      const phrases = [
        'check my balance',
        'how much is in my wallet',
        'how much dey inside my wallet',
        'wetin be my balance',
        'how many xlm do i have',
        'check my funds',
      ];

      for (const phrase of phrases) {
        const res = IntentResolver.resolve(phrase);
        expect(res.intent).toBe('check_balance');
        expect(res.confidence).toBeGreaterThanOrEqual(0.9);
      }
    });

    test('resolves receiving address inquiries', () => {
      const phrases = [
        'show my receiving address',
        'what is my public address',
        'wetin be my address',
        'show my qr code',
        'how can i receive money',
      ];

      for (const phrase of phrases) {
        const res = IntentResolver.resolve(phrase);
        expect(res.intent).toBe('receive_funds');
      }
    });

    test('resolves contact book inquiries', () => {
      expect(IntentResolver.resolve('contacts').intent).toBe('list_contacts');
      expect(IntentResolver.resolve('show my contacts').intent).toBe('list_contacts');
      expect(IntentResolver.resolve('who dey my contact').intent).toBe('list_contacts');
    });

    test('resolves transaction history queries', () => {
      expect(IntentResolver.resolve('show recent transactions').intent).toBe('view_history');
      expect(IntentResolver.resolve('past transactions').intent).toBe('view_history');
      expect(IntentResolver.resolve('wetin i spend').intent).toBe('view_history');
    });
  });

  describe('Payment Intent & Entity Extraction', () => {
    test('extracts amount, asset, recipient and memo from complete command', () => {
      const res = IntentResolver.resolve('Send 10 XLM to David with memo for lunch');
      expect(res.intent).toBe('send_payment');
      expect(res.entities.amount).toBe('10');
      expect(res.entities.asset).toBe('XLM');
      expect(res.entities.recipient).toBe('David');
      expect(res.entities.memo).toBe('for lunch');
    });

    test('extracts written number words and Nigerian phrasing', () => {
      const res = IntentResolver.resolve('Abeg transfer five lumens give Amina');
      expect(res.intent).toBe('send_payment');
      expect(res.entities.amount).toBe('5');
      expect(res.entities.asset).toBe('XLM');
      expect(res.entities.recipient).toBe('Amina');
    });

    test('extracts USDC asset and decimal amounts', () => {
      const res = IntentResolver.resolve('Pay Musa 15.5 USDC');
      expect(res.intent).toBe('send_payment');
      expect(res.entities.amount).toBe('15.5');
      expect(res.entities.asset).toBe('USDC');
      expect(res.entities.recipient).toBe('Musa');
    });

    test('extracts 56-character Stellar G-address recipient', () => {
      const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
      const res = IntentResolver.resolve(`Send 20 XLM to ${address}`);
      expect(res.intent).toBe('send_payment');
      expect(res.entities.amount).toBe('20');
      expect(res.entities.recipient).toBe(address);
    });
  });
});
