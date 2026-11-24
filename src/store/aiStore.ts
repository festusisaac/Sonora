import { create } from 'zustand';
import {
  ConversationTurn,
  AssistantVisualState,
  WorkflowStep,
  PaymentDraftContext,
} from '../services/ai/aiTypes';

export interface AIStoreState {
  messages: ConversationTurn[];
  assistantState: AssistantVisualState;
  workflowStep: WorkflowStep;
  activeDraft: PaymentDraftContext | null;
  lastSpokenMessage: string | null;
  suggestedQuickReplies: string[];
  speechSpeed: number;

  // Actions
  addMessage: (message: ConversationTurn) => void;
  setAssistantState: (state: AssistantVisualState) => void;
  setWorkflowStep: (step: WorkflowStep) => void;
  setActiveDraft: (draft: PaymentDraftContext | null) => void;
  setLastSpokenMessage: (text: string | null) => void;
  setSuggestedQuickReplies: (replies: string[]) => void;
  setSpeechSpeed: (speed: number) => void;
  clearConversation: () => void;
}

export const useAIStore = create<AIStoreState>((set) => ({
  messages: [],
  assistantState: 'idle',
  workflowStep: 'idle',
  activeDraft: null,
  lastSpokenMessage: null,
  suggestedQuickReplies: ['Check Balance', 'Send XLM', 'My Address', 'Help'],
  speechSpeed: 1.0,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-29), message],
    })),

  setAssistantState: (assistantState) => set({ assistantState }),

  setWorkflowStep: (workflowStep) => set({ workflowStep }),

  setActiveDraft: (activeDraft) => set({ activeDraft }),

  setLastSpokenMessage: (lastSpokenMessage) => set({ lastSpokenMessage }),

  setSuggestedQuickReplies: (suggestedQuickReplies) =>
    set({ suggestedQuickReplies }),

  setSpeechSpeed: (speechSpeed) => set({ speechSpeed }),

  clearConversation: () =>
    set({
      messages: [],
      assistantState: 'idle',
      workflowStep: 'idle',
      activeDraft: null,
      lastSpokenMessage: null,
      suggestedQuickReplies: ['Check Balance', 'Send XLM', 'My Address', 'Help'],
    }),
}));
