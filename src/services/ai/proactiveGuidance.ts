import {
  PaymentDraftContext,
  DisambiguationCandidate,
} from './aiTypes';

/**
 * Spoken Guidance & Formatting Helper for Visually Impaired Users
 * Ensures high intelligibility, clear pronunciation, and zero ambiguity.
 */
export class ProactiveGuidance {
  /**
   * Speak Stellar public address intelligibly without overwhelming 56 raw chars
   */
  public static formatAddressForSpeech(address: string): string {
    if (!address || address.length < 8) return 'Stellar address';
    const start = address.slice(0, 4).split('').join(' ');
    const end = address.slice(-4).split('').join(' ');
    return `${start}, ending in, ${end}`;
  }

  /**
   * Format asset amounts clearly (e.g., "5 XLM", "10 point 5 USDC")
   */
  public static formatAmountForSpeech(amount: string, asset: string = 'XLM'): string {
    const cleanAmount = amount.replace('.', ' point ');
    return `${cleanAmount} ${asset}`;
  }

  /**
   * Generate clear spoken review summary for explicit user authorization
   */
  public static formatReviewSummary(draft: PaymentDraftContext): string {
    const recipientText = draft.recipientName
      ? `${draft.recipientName} at address ${this.formatAddressForSpeech(draft.recipient || '')}`
      : `address ${this.formatAddressForSpeech(draft.recipient || '')}`;

    const amountText = this.formatAmountForSpeech(draft.amount || '0', draft.asset || 'XLM');
    const feeText = draft.fee ? `${draft.fee} XLM` : 'standard network fee';
    const memoText = draft.memo ? `with memo: ${draft.memo}.` : 'without a memo.';

    return `Payment review: You are about to send ${amountText} to ${recipientText}, ${memoText} Network fee is ${feeText}. To authorize this payment, please say confirm, or double tap the review button on your screen.`;
  }

  /**
   * Prompt user to resolve ambiguous contact names
   */
  public static formatDisambiguationPrompt(candidates: DisambiguationCandidate[]): string {
    const candidateList = candidates
      .map((c) => `Option ${c.index}: ${c.name}, address ending in ${c.address.slice(-4)}`)
      .join('. ');

    return `I found ${candidates.length} contacts matching that name. ${candidateList}. Please say option 1 or option 2 to choose.`;
  }

  /**
   * Spoken prompt for missing payment fields
   */
  public static formatMissingFieldPrompt(field: 'recipient' | 'amount' | 'asset'): string {
    switch (field) {
      case 'recipient':
        return 'Who would you like to send this payment to? You can say a contact name or a Stellar address.';
      case 'amount':
        return 'How much would you like to send? For example, say five XLM.';
      case 'asset':
        return 'Which asset would you like to send? XLM or USDC?';
    }
  }
}
