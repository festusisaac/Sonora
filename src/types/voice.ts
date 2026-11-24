export type SpeechRecognitionStatus =
  | 'idle'
  | 'listening'
  | 'recognizing'
  | 'success'
  | 'error';

export type SpokenResponseStatus =
  | 'idle'
  | 'speaking'
  | 'paused'
  | 'completed'
  | 'error';

export interface ParsedVoiceCommand {
  type: 'CHECK_BALANCE' | 'SEND_PAYMENT' | 'RECENT_TRANSACTIONS' | 'UNKNOWN';
  rawText: string;
  params?: {
    amount?: string;
    asset?: string;
    recipient?: string;
  };
  confidence?: number;
}

export interface VoiceState {
  isListening: boolean;
  recognitionStatus: SpeechRecognitionStatus;
  lastRecognizedPhrase: string | null;
  spokenResponseStatus: SpokenResponseStatus;
  lastSpokenText: string | null;
  errorMessage: string | null;
}
