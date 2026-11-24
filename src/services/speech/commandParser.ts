import { ParsedVoiceCommand } from '../../types/voice';

/**
 * Parses raw speech phrases into structured wallet actions
 * Supported initial phrases:
 * - "Check my balance" / "What is my balance?"
 * - "Send [amount] [asset] to [recipient]"
 * - "Show my recent transactions" / "Transaction history"
 */
export function parseVoiceCommand(rawInput: string): ParsedVoiceCommand {
  const normalized = rawInput.trim().toLowerCase();

  // 1. Balance checks
  if (
    normalized.includes('balance') ||
    normalized.includes('how much money') ||
    normalized.includes('how much xlm')
  ) {
    return {
      type: 'CHECK_BALANCE',
      rawText: rawInput,
      confidence: 0.95,
    };
  }

  // 2. Transaction history
  if (
    normalized.includes('recent transactions') ||
    normalized.includes('history') ||
    normalized.includes('activity')
  ) {
    return {
      type: 'RECENT_TRANSACTIONS',
      rawText: rawInput,
      confidence: 0.9,
    };
  }

  // 3. Send payment: "Send 25 USDC to Musa" or "Send 10 XLM to Alex"
  const sendRegex = /send\s+([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)?\s+to\s+([a-zA-Z0-9_\-\s]+)/i;
  const match = normalized.match(sendRegex);

  if (match) {
    const amount = match[1];
    let asset = (match[2] || 'XLM').toUpperCase();
    const recipient = match[3].trim();

    return {
      type: 'SEND_PAYMENT',
      rawText: rawInput,
      params: {
        amount,
        asset,
        recipient,
      },
      confidence: 0.85,
    };
  }

  return {
    type: 'UNKNOWN',
    rawText: rawInput,
    confidence: 0.2,
  };
}
