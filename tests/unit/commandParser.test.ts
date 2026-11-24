import { parseVoiceCommand } from '../../src/services/speech/commandParser';

describe('Voice Command Parser', () => {
  it('should identify balance check commands', () => {
    const inputs = [
      'Check my balance',
      'what is my balance?',
      'How much money do I have',
      'how much xlm is in my wallet',
    ];

    for (const input of inputs) {
      const parsed = parseVoiceCommand(input);
      expect(parsed.type).toBe('CHECK_BALANCE');
      expect(parsed.confidence).toBeGreaterThan(0.9);
    }
  });

  it('should parse payment instructions with amount, asset and recipient', () => {
    const parsed = parseVoiceCommand('Send 25 USDC to Musa');
    expect(parsed.type).toBe('SEND_PAYMENT');
    expect(parsed.params?.amount).toBe('25');
    expect(parsed.params?.asset).toBe('USDC');
    expect(parsed.params?.recipient).toBe('musa');
  });

  it('should default asset to XLM when not explicitly stated', () => {
    const parsed = parseVoiceCommand('Send 10 to Alex');
    expect(parsed.type).toBe('SEND_PAYMENT');
    expect(parsed.params?.amount).toBe('10');
    expect(parsed.params?.asset).toBe('XLM');
    expect(parsed.params?.recipient).toBe('alex');
  });

  it('should classify unknown voice input cleanly', () => {
    const parsed = parseVoiceCommand('What is the weather today?');
    expect(parsed.type).toBe('UNKNOWN');
  });
});
