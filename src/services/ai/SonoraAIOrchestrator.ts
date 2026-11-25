import {
  ConversationTurn,
  AIResponse,
  PaymentDraftContext,
  DisambiguationCandidate,
} from './aiTypes';
import { WALLET_TOOLS } from './toolRegistry';
import { ToolDispatcher } from './toolDispatcher';
import { ProviderFactory } from './providers/ProviderFactory';
import { IntentResolver } from './intentResolver';
import { ConversationContextManager } from './contextManager';
import { ProactiveGuidance } from './proactiveGuidance';
import { TTSService } from '../speech/tts';
import { useAIStore } from '../../store/aiStore';

export class SonoraAIOrchestrator {
  private static instance: SonoraAIOrchestrator;
  private contextManager: ConversationContextManager;

  private constructor() {
    this.contextManager = new ConversationContextManager();
  }

  public static getInstance(): SonoraAIOrchestrator {
    if (!SonoraAIOrchestrator.instance) {
      SonoraAIOrchestrator.instance = new SonoraAIOrchestrator();
    }
    return SonoraAIOrchestrator.instance;
  }

  public getContextManager(): ConversationContextManager {
    return this.contextManager;
  }

  /**
   * Main entry point: process user spoken or text input through the AI wallet pipeline.
   */
  public async processUserInput(
    rawInput: string,
    activePublicKey?: string | null
  ): Promise<AIResponse> {
    const input = rawInput.trim();
    if (!input) {
      return { text: "I didn't hear anything. How can I help you?", intent: 'unknown' };
    }

    const store = useAIStore.getState();
    store.setAssistantState('thinking');

    const userTurn: ConversationTurn = {
      id: `turn-user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    this.contextManager.addTurn(userTurn);
    store.addMessage(userTurn);

    try {
      // 1. Fast-path intent resolution
      const resolution = IntentResolver.resolve(input);

      // Handle STOP command immediately
      if (resolution.intent === 'stop') {
        await TTSService.stop();
        store.setAssistantState('idle');
        return { text: '', intent: 'stop' };
      }

      // Handle REPEAT command
      if (resolution.intent === 'repeat') {
        const lastSpoken = this.contextManager.getLastSpokenText() || store.lastSpokenMessage || 'There is nothing to repeat.';
        await this.speak(lastSpoken);
        return { text: lastSpoken, intent: 'repeat' };
      }

      // Handle CANCEL command
      if (resolution.intent === 'cancel') {
        const message = this.contextManager.cancelWorkflow();
        store.setWorkflowStep('idle');
        store.setActiveDraft(null);
        await this.speak(message);
        return { text: message, intent: 'cancel', suggestedQuickReplies: ['Check Balance', 'Send XLM'] };
      }

      // Handle SPEECH SPEED adjustment
      if (resolution.intent === 'adjust_speech' && resolution.entities.speechSpeed) {
        const newSpeed = resolution.entities.speechSpeed;
        await ToolDispatcher.executeToolCall({
          id: 'tool-speed',
          name: 'updateSpeechSpeed',
          parameters: { speed: newSpeed },
        });
        store.setSpeechSpeed(newSpeed);
        const text = `Speech speed adjusted to ${newSpeed > 1 ? 'faster' : 'slower'}.`;
        await this.speak(text);
        return { text, intent: 'adjust_speech' };
      }

      // Handle conversational interruption: checking balance while an active payment draft is in progress
      const currentStep = this.contextManager.getStep();
      if (
        resolution.intent === 'check_balance' &&
        (currentStep === 'collecting_payment_details' ||
          currentStep === 'awaiting_review' ||
          currentStep === 'disambiguating_recipient')
      ) {
        const toolResult = await ToolDispatcher.executeToolCall(
          { id: `call-${Date.now()}`, name: 'getBalances', parameters: {} },
          activePublicKey
        );
        let balanceSpeech = 'You currently have 0 XLM available to spend.';
        if (!toolResult.error && toolResult.result) {
          const balances = toolResult.result as {
            nativeBalance: string;
            availableNativeBalance: string;
          };
          balanceSpeech = `You currently have ${ProactiveGuidance.formatAmountForSpeech(balances.availableNativeBalance, 'XLM')} available to spend.`;
        }

        const draft = this.contextManager.getDraft();
        let reminder = '';
        if (currentStep === 'awaiting_review' && draft.amount) {
          reminder = ` You have an active draft to send ${draft.amount} ${draft.asset || 'XLM'} to ${draft.recipientName || draft.recipient?.slice(0, 8)}. Would you like to confirm, or say cancel?`;
        } else if (currentStep === 'collecting_payment_details') {
          if (draft.recipientName || draft.recipient) {
            reminder = ` You are preparing a payment to ${draft.recipientName || draft.recipient?.slice(0, 8)}. How much would you like to send?`;
          } else {
            reminder = ' Who would you like to send your payment to?';
          }
        } else if (currentStep === 'disambiguating_recipient') {
          reminder = ' Which contact did you want to select?';
        }

        const fullResponse = `${balanceSpeech}${reminder}`;
        await this.speak(fullResponse);
        return {
          text: fullResponse,
          intent: 'check_balance',
          workflowState: currentStep,
          suggestedQuickReplies: currentStep === 'awaiting_review' ? ['Confirm', 'Cancel'] : ['Cancel'],
        };
      }

      // 2. State Machine: active disambiguation
      if (currentStep === 'disambiguating_recipient') {
        const draft = this.contextManager.getDraft();
        const candidates = draft.disambiguationCandidates || [];
        let chosen: DisambiguationCandidate | undefined = undefined;

        if (resolution.entities.choiceIndex && candidates[resolution.entities.choiceIndex - 1]) {
          chosen = candidates[resolution.entities.choiceIndex - 1];
        } else {
          // Check if user spoke a candidate name
          chosen = candidates.find((c) =>
            input.toLowerCase().includes(c.name.toLowerCase())
          );
        }

        if (chosen) {
          this.contextManager.resolveDisambiguation(chosen);
          const updatedDraft = this.contextManager.getDraft();

          if (!updatedDraft.amount) {
            const prompt = `Selected ${chosen.name}. How much would you like to send?`;
            store.setWorkflowStep('collecting_payment_details');
            await this.speak(prompt);
            return {
              text: prompt,
              intent: 'send_payment',
              workflowState: 'collecting_payment_details',
              suggestedQuickReplies: ['5 XLM', '10 XLM', 'Cancel'],
            };
          } else {
            // Both recipient and amount ready: prepare draft
            return await this.executePaymentPreparation(activePublicKey);
          }
        } else {
          const prompt = ProactiveGuidance.formatDisambiguationPrompt(candidates);
          await this.speak(prompt);
          return {
            text: prompt,
            intent: 'confirm_choice',
            workflowState: 'disambiguating_recipient',
          };
        }
      }

      // 3. State Machine: collecting payment details
      if (currentStep === 'collecting_payment_details') {
        const updates: Partial<PaymentDraftContext> = {};
        if (resolution.entities.amount) updates.amount = resolution.entities.amount;
        if (resolution.entities.recipient) updates.recipient = resolution.entities.recipient;
        if (resolution.entities.asset) updates.asset = resolution.entities.asset;
        if (resolution.entities.memo) updates.memo = resolution.entities.memo;

        this.contextManager.updateDraft(updates);
        const currentDraft = this.contextManager.getDraft();

        if (!currentDraft.recipient) {
          const prompt = ProactiveGuidance.formatMissingFieldPrompt('recipient');
          await this.speak(prompt);
          return {
            text: prompt,
            intent: 'send_payment',
            workflowState: 'collecting_payment_details',
            suggestedQuickReplies: ['To Amina', 'To David', 'Cancel'],
          };
        }

        if (!currentDraft.amount) {
          const prompt = ProactiveGuidance.formatMissingFieldPrompt('amount');
          await this.speak(prompt);
          return {
            text: prompt,
            intent: 'send_payment',
            workflowState: 'collecting_payment_details',
            suggestedQuickReplies: ['5 XLM', '10 XLM', 'Cancel'],
          };
        }

        // Both recipient and amount are present: prepare draft
        return await this.executePaymentPreparation(activePublicKey);
      }

      // 4. State Machine: awaiting review
      if (currentStep === 'awaiting_review') {
        const draft = this.contextManager.getDraft();
        if (resolution.intent === 'confirm_choice') {
          const prompt = 'To authorize and sign this payment, please use biometric confirmation or enter your device PIN on your screen.';
          store.setWorkflowStep('awaiting_authorization');
          await this.speak(prompt);
          return {
            text: prompt,
            intent: 'confirm_choice',
            workflowState: 'awaiting_authorization',
            suggestedQuickReplies: ['Authorize Now', 'Cancel'],
          };
        } else {
          const review = ProactiveGuidance.formatReviewSummary(draft);
          await this.speak(review);
          return {
            text: review,
            intent: 'send_payment',
            workflowState: 'awaiting_review',
            suggestedQuickReplies: ['Confirm', 'Cancel'],
          };
        }
      }

      // 5. Handling New Intent Resolution
      switch (resolution.intent) {
        case 'check_balance': {
          const toolResult = await ToolDispatcher.executeToolCall(
            { id: `call-${Date.now()}`, name: 'getBalances', parameters: {} },
            activePublicKey
          );
          if (toolResult.error) {
            const errorText = `Unable to retrieve balance: ${toolResult.error}`;
            await this.speak(errorText);
            return { text: errorText, intent: 'check_balance' };
          }
          const balances = toolResult.result as {
            nativeBalance: string;
            availableNativeBalance: string;
            assetBalances: { assetCode: string; balance: string }[];
          };
          const speech = `Your total Stellar balance is ${ProactiveGuidance.formatAmountForSpeech(balances.nativeBalance, 'XLM')}. Your available balance after minimum reserves is ${ProactiveGuidance.formatAmountForSpeech(balances.availableNativeBalance, 'XLM')}.`;
          await this.speak(speech);
          return {
            text: speech,
            intent: 'check_balance',
            suggestedQuickReplies: ['Send XLM', 'My Address', 'History'],
          };
        }

        case 'receive_funds': {
          const toolResult = await ToolDispatcher.executeToolCall(
            { id: `call-${Date.now()}`, name: 'getReceivingAddress', parameters: {} },
            activePublicKey
          );
          if (toolResult.error) {
            const err = `Could not fetch address: ${toolResult.error}`;
            await this.speak(err);
            return { text: err, intent: 'receive_funds' };
          }
          const data = toolResult.result as { publicKey: string };
          const spokenAddr = ProactiveGuidance.formatAddressForSpeech(data.publicKey);
          const speech = `Your Stellar receiving address is ${spokenAddr}. Your full public address and QR code are displayed on screen.`;
          await this.speak(speech);
          return {
            text: speech,
            intent: 'receive_funds',
            suggestedQuickReplies: ['Check Balance', 'Send XLM'],
          };
        }

        case 'list_contacts': {
          const toolResult = await ToolDispatcher.executeToolCall(
            { id: `call-${Date.now()}`, name: 'listContacts', parameters: {} }
          );
          const data = toolResult.result as { contacts: { name: string }[]; count: number };
          if (data.count === 0) {
            const speech = 'You do not have any saved contacts yet. You can add one by speaking their name and Stellar address.';
            await this.speak(speech);
            return { text: speech, intent: 'list_contacts', suggestedQuickReplies: ['Add Contact', 'Check Balance'] };
          }
          const names = data.contacts.map((c) => c.name).join(', ');
          const speech = `You have ${data.count} saved contact${data.count === 1 ? '' : 's'}: ${names}.`;
          await this.speak(speech);
          return {
            text: speech,
            intent: 'list_contacts',
            suggestedQuickReplies: ['Send Money', 'Add Contact'],
          };
        }

        case 'view_history': {
          const toolResult = await ToolDispatcher.executeToolCall(
            { id: `call-${Date.now()}`, name: 'getTransactionHistory', parameters: { limit: 3 } },
            activePublicKey
          );
          if (toolResult.error) {
            const err = `Could not load transaction history: ${toolResult.error}`;
            await this.speak(err);
            return { text: err, intent: 'view_history' };
          }
          const data = toolResult.result as { history: { type: string; amount?: string; assetCode?: string; destination?: string }[]; count: number };
          if (data.count === 0) {
            const speech = 'No recent transactions found on Stellar Testnet for your account.';
            await this.speak(speech);
            return { text: speech, intent: 'view_history' };
          }
          const summary = data.history
            .map((tx, idx) => `${idx + 1}: ${tx.type === 'payment' ? 'Payment of ' + tx.amount + ' ' + (tx.assetCode || 'XLM') : tx.type}`)
            .join('. ');
          const speech = `Recent activity: ${summary}.`;
          await this.speak(speech);
          return { text: speech, intent: 'view_history', suggestedQuickReplies: ['Check Balance', 'Send XLM'] };
        }

        case 'send_payment': {
          this.contextManager.startPaymentWorkflow(resolution.entities);
          const currentDraft = this.contextManager.getDraft();

          if (!currentDraft.recipient) {
            const prompt = ProactiveGuidance.formatMissingFieldPrompt('recipient');
            store.setWorkflowStep('collecting_payment_details');
            await this.speak(prompt);
            return {
              text: prompt,
              intent: 'send_payment',
              workflowState: 'collecting_payment_details',
              suggestedQuickReplies: ['To Amina', 'To David', 'Cancel'],
            };
          }

          if (!currentDraft.amount) {
            const prompt = ProactiveGuidance.formatMissingFieldPrompt('amount');
            store.setWorkflowStep('collecting_payment_details');
            await this.speak(prompt);
            return {
              text: prompt,
              intent: 'send_payment',
              workflowState: 'collecting_payment_details',
              suggestedQuickReplies: ['5 XLM', '10 XLM', 'Cancel'],
            };
          }

          return await this.executePaymentPreparation(activePublicKey);
        }

        case 'greeting': {
          const speech =
            "Hello! I am SONORA, your voice wallet companion. I'm listening. How can I help you with your Stellar wallet today?";
          await this.speak(speech);
          return {
            text: speech,
            intent: 'greeting',
            suggestedQuickReplies: ['Check Balance', 'Send XLM', 'My Address'],
          };
        }

        case 'help': {
          const speech =
            'SONORA is your voice-first Stellar wallet companion. You can say: Check my balance, Send 5 XLM to David, Show my address, List my contacts, Show recent transactions, Speak slower, or Stop at any time.';
          await this.speak(speech);
          return {
            text: speech,
            intent: 'help',
            suggestedQuickReplies: ['Check Balance', 'Send XLM', 'My Address', 'Contacts'],
          };
        }

        default: {
          // Fallback to active AI Provider for natural language interaction
          const provider = ProviderFactory.getInstance().getProvider();
          const aiResponse = await provider.generateResponse(
            this.contextManager.getTurns(),
            WALLET_TOOLS
          );

          if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
            const toolCall = aiResponse.toolCalls[0];
            const toolResult = await ToolDispatcher.executeToolCall(toolCall, activePublicKey);
            const toolResultTurn: ConversationTurn = {
              id: `tool-${Date.now()}`,
              role: 'tool',
              content: JSON.stringify(toolResult.result || toolResult.error),
              toolCallId: toolCall.id,
              timestamp: Date.now(),
            };
            this.contextManager.addTurn(toolResultTurn);
          }

          const responseText = aiResponse.text || "I'm here to help you manage your Stellar wallet. How can I assist you?";
          await this.speak(responseText);
          return {
            text: responseText,
            intent: aiResponse.intent || 'general_query',
            suggestedQuickReplies: aiResponse.suggestedQuickReplies || ['Check Balance', 'Send XLM', 'Help'],
          };
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const text = `Sorry, an error occurred: ${errorMsg}`;
      await this.speak(text);
      return { text, intent: 'unknown' };
    } finally {
      store.setAssistantState('idle');
    }
  }

  /**
   * Helper to prepare an unsigned payment draft and present it for explicit review.
   */
  private async executePaymentPreparation(
    activePublicKey?: string | null
  ): Promise<AIResponse> {
    const store = useAIStore.getState();
    const draft = this.contextManager.getDraft();

    const toolResult = await ToolDispatcher.executeToolCall(
      {
        id: `call-prep-${Date.now()}`,
        name: 'preparePayment',
        parameters: {
          recipient: draft.recipient,
          amount: draft.amount,
          assetCode: draft.asset || 'XLM',
          memo: draft.memo,
        },
      },
      activePublicKey
    );

    if (toolResult.error) {
      this.contextManager.reset();
      store.setWorkflowStep('idle');
      store.setActiveDraft(null);
      const errorSpeech = `Could not prepare payment: ${toolResult.error}`;
      await this.speak(errorSpeech);
      return {
        text: errorSpeech,
        intent: 'send_payment',
        suggestedQuickReplies: ['Try Again', 'Check Balance'],
      };
    }

    const resultData = toolResult.result as {
      status: string;
      candidates?: DisambiguationCandidate[];
      recipient?: string;
      recipientName?: string;
      amount?: string;
      assetCode?: 'XLM' | 'USDC';
      fee?: string;
      memo?: string;
      transactionHash?: string;
      unsignedXdr?: string;
    };

    // If ambiguous contacts were found
    if (resultData.status === 'AMBIGUOUS_RECIPIENT' && resultData.candidates) {
      this.contextManager.setDisambiguation(resultData.candidates);
      store.setWorkflowStep('disambiguating_recipient');
      store.setActiveDraft(this.contextManager.getDraft());
      const prompt = ProactiveGuidance.formatDisambiguationPrompt(resultData.candidates);
      await this.speak(prompt);
      return {
        text: prompt,
        intent: 'send_payment',
        workflowState: 'disambiguating_recipient',
      };
    }

    // Unsigned draft prepared successfully: transition to awaiting_review
    const preparedDraft: PaymentDraftContext = {
      recipient: resultData.recipient,
      recipientName: resultData.recipientName || draft.recipientName,
      amount: resultData.amount,
      asset: resultData.assetCode,
      fee: resultData.fee,
      memo: resultData.memo,
      transactionHash: resultData.transactionHash,
      unsignedXdr: resultData.unsignedXdr,
    };

    this.contextManager.setAwaitingReview(preparedDraft);
    store.setWorkflowStep('awaiting_review');
    store.setActiveDraft(preparedDraft);

    const reviewSpokenText = ProactiveGuidance.formatReviewSummary(preparedDraft);
    await this.speak(reviewSpokenText);

    return {
      text: reviewSpokenText,
      intent: 'send_payment',
      workflowState: 'awaiting_review',
      suggestedQuickReplies: ['Confirm', 'Cancel'],
    };
  }

  private async speak(text: string): Promise<void> {
    const store = useAIStore.getState();
    this.contextManager.setLastSpokenText(text);
    store.setLastSpokenMessage(text);
    store.setAssistantState('speaking');

    const assistantTurn: ConversationTurn = {
      id: `turn-assistant-${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
    };
    this.contextManager.addTurn(assistantTurn);
    store.addMessage(assistantTurn);

    try {
      await TTSService.speak(text, {
        rate: store.speechSpeed,
        onDone: () => store.setAssistantState('idle'),
        onError: () => store.setAssistantState('idle'),
      });
    } catch {
      store.setAssistantState('idle');
    }
  }
}
