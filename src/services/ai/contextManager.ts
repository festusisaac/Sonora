import {
  WorkflowStep,
  PaymentDraftContext,
  DisambiguationCandidate,
  ConversationTurn,
} from './aiTypes';

export class ConversationContextManager {
  private currentStep: WorkflowStep = 'idle';
  private draft: PaymentDraftContext = {};
  private turns: ConversationTurn[] = [];
  private lastSpokenText: string = '';

  public getStep(): WorkflowStep {
    return this.currentStep;
  }

  public getDraft(): Readonly<PaymentDraftContext> {
    return this.draft;
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public setLastSpokenText(text: string): void {
    this.lastSpokenText = text;
  }

  public startPaymentWorkflow(initial?: Partial<PaymentDraftContext>): void {
    this.currentStep = 'collecting_payment_details';
    this.draft = {
      asset: 'XLM',
      ...initial,
    };
    this.updateMissingFields();
  }

  public updateDraft(updates: Partial<PaymentDraftContext>): void {
    this.draft = {
      ...this.draft,
      ...updates,
    };
    this.updateMissingFields();
  }

  public setDisambiguation(candidates: DisambiguationCandidate[]): void {
    this.currentStep = 'disambiguating_recipient';
    this.draft.isDisambiguating = true;
    this.draft.disambiguationCandidates = candidates;
  }

  public resolveDisambiguation(candidate: DisambiguationCandidate): void {
    this.draft.recipient = candidate.address;
    this.draft.recipientName = candidate.name;
    this.draft.isDisambiguating = false;
    this.draft.disambiguationCandidates = undefined;

    if (this.draft.amount) {
      this.currentStep = 'collecting_payment_details';
    } else {
      this.currentStep = 'collecting_payment_details';
    }
    this.updateMissingFields();
  }

  public setAwaitingReview(preparedDraft: PaymentDraftContext): void {
    this.currentStep = 'awaiting_review';
    this.draft = {
      ...this.draft,
      ...preparedDraft,
    };
    this.draft.missingFields = [];
  }

  public cancelWorkflow(): string {
    const wasActive = this.currentStep !== 'idle';
    this.reset();
    return wasActive ? 'Payment workflow cancelled.' : 'Action cancelled.';
  }

  public reset(): void {
    this.currentStep = 'idle';
    this.draft = {};
  }

  public updateMissingFields(): ('recipient' | 'amount' | 'asset')[] {
    const missing: ('recipient' | 'amount' | 'asset')[] = [];
    if (!this.draft.recipient) missing.push('recipient');
    if (!this.draft.amount) missing.push('amount');
    if (!this.draft.asset) missing.push('asset');
    this.draft.missingFields = missing;
    return missing;
  }

  public addTurn(turn: ConversationTurn): void {
    this.turns.push(turn);
    // Keep reasonable turn history length
    if (this.turns.length > 30) {
      this.turns.shift();
    }
  }

  public getTurns(): ConversationTurn[] {
    return [...this.turns];
  }

  public clearTurns(): void {
    this.turns = [];
  }
}
