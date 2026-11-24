import { ConversationContextManager } from '../../src/services/ai/contextManager';
import { DisambiguationCandidate } from '../../src/services/ai/aiTypes';

describe('Conversation Context Manager', () => {
  let context: ConversationContextManager;

  beforeEach(() => {
    context = new ConversationContextManager();
  });

  test('starts in idle state with empty draft', () => {
    expect(context.getStep()).toBe('idle');
    expect(context.getDraft()).toEqual({});
    expect(context.getTurns()).toHaveLength(0);
  });

  test('transitions to collecting_payment_details when payment workflow begins', () => {
    context.startPaymentWorkflow({ recipient: 'Amina' });
    expect(context.getStep()).toBe('collecting_payment_details');
    const draft = context.getDraft();
    expect(draft.recipient).toBe('Amina');
    expect(draft.asset).toBe('XLM');
    expect(draft.missingFields).toContain('amount');
  });

  test('correctly tracks missing fields as user supplies information', () => {
    context.startPaymentWorkflow();
    expect(context.getDraft().missingFields).toEqual(['recipient', 'amount']);

    context.updateDraft({ recipient: 'David' });
    expect(context.getDraft().missingFields).toEqual(['amount']);

    context.updateDraft({ amount: '25' });
    expect(context.getDraft().missingFields).toEqual([]);
  });

  test('handles ambiguous recipients and resolution', () => {
    const candidates: DisambiguationCandidate[] = [
      { id: '1', name: 'David Okafor', address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', index: 1 },
      { id: '2', name: 'David Musa', address: 'GCO2M4D6PZ7K4Z5F7G3E5L9N8Q2P4R6T8V0X2Z4B6D8F0H2J4L6N8P0R', index: 2 },
    ];

    context.startPaymentWorkflow({ amount: '10' });
    context.setDisambiguation(candidates);

    expect(context.getStep()).toBe('disambiguating_recipient');
    expect(context.getDraft().isDisambiguating).toBe(true);
    expect(context.getDraft().disambiguationCandidates).toHaveLength(2);

    // Resolve with candidate 2
    context.resolveDisambiguation(candidates[1]);
    expect(context.getDraft().recipientName).toBe('David Musa');
    expect(context.getDraft().recipient).toBe('GCO2M4D6PZ7K4Z5F7G3E5L9N8Q2P4R6T8V0X2Z4B6D8F0H2J4L6N8P0R');
    expect(context.getDraft().isDisambiguating).toBe(false);
  });

  test('transitions to awaiting_review with complete draft', () => {
    context.startPaymentWorkflow({ recipient: 'Amina', amount: '15' });
    context.setAwaitingReview({
      recipient: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipientName: 'Amina',
      amount: '15',
      asset: 'XLM',
      fee: '0.00001',
      transactionHash: 'a'.repeat(64),
    });

    expect(context.getStep()).toBe('awaiting_review');
    expect(context.getDraft().transactionHash).toHaveLength(64);
    expect(context.getDraft().fee).toBe('0.00001');
  });

  test('cancels active workflow and resets clean state', () => {
    context.startPaymentWorkflow({ recipient: 'Amina', amount: '15' });
    expect(context.getStep()).toBe('collecting_payment_details');

    const cancellationMessage = context.cancelWorkflow();
    expect(cancellationMessage).toBe('Payment workflow cancelled.');
    expect(context.getStep()).toBe('idle');
    expect(context.getDraft()).toEqual({});
  });

  test('records turns and bounds maximum history length', () => {
    for (let i = 0; i < 35; i++) {
      context.addTurn({
        id: `turn-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: Date.now(),
      });
    }

    const turns = context.getTurns();
    expect(turns.length).toBeLessThanOrEqual(30);
    expect(turns[turns.length - 1].content).toBe('Message 34');
  });
});
