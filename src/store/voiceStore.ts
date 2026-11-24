import { create } from 'zustand';
import {
  SpeechRecognitionStatus,
  SpokenResponseStatus,
} from '../types/voice';

export interface VoiceStoreState {
  isListening: boolean;
  recognitionStatus: SpeechRecognitionStatus;
  lastRecognizedPhrase: string | null;
  spokenResponseStatus: SpokenResponseStatus;
  lastSpokenText: string | null;
  errorMessage: string | null;

  // Actions
  setListening: (isListening: boolean) => void;
  setRecognitionStatus: (status: SpeechRecognitionStatus) => void;
  setLastRecognizedPhrase: (phrase: string | null) => void;
  setSpokenResponseStatus: (status: SpokenResponseStatus) => void;
  setLastSpokenText: (text: string | null) => void;
  setError: (error: string | null) => void;
  resetVoiceState: () => void;
}

export const useVoiceStore = create<VoiceStoreState>((set) => ({
  isListening: false,
  recognitionStatus: 'idle',
  lastRecognizedPhrase: null,
  spokenResponseStatus: 'idle',
  lastSpokenText: null,
  errorMessage: null,

  setListening: (isListening) =>
    set({
      isListening,
      recognitionStatus: isListening ? 'listening' : 'idle',
    }),

  setRecognitionStatus: (recognitionStatus) => set({ recognitionStatus }),

  setLastRecognizedPhrase: (lastRecognizedPhrase) =>
    set({ lastRecognizedPhrase }),

  setSpokenResponseStatus: (spokenResponseStatus) =>
    set({ spokenResponseStatus }),

  setLastSpokenText: (lastSpokenText) => set({ lastSpokenText }),

  setError: (errorMessage) =>
    set({
      errorMessage,
      recognitionStatus: 'error',
      isListening: false,
    }),

  resetVoiceState: () =>
    set({
      isListening: false,
      recognitionStatus: 'idle',
      lastRecognizedPhrase: null,
      spokenResponseStatus: 'idle',
      lastSpokenText: null,
      errorMessage: null,
    }),
}));
