/**
 * Speech-To-Text Adapter Interface
 * Allows clean separation between Expo development builds, native speech modules,
 * and future offline/on-device Whisper models.
 */
export interface ISpeechToTextAdapter {
  isAvailable(): Promise<boolean>;
  startListening(
    onResult: (phrase: string) => void,
    onError: (error: Error) => void
  ): Promise<void>;
  stopListening(): Promise<void>;
}

/**
 * Development / Fallback Speech-To-Text Adapter
 * Provides simulated speech inputs for testing accessibility in development environments
 * where native speech recognition permissions or packages require custom builds.
 */
export class DevSpeechToTextAdapter implements ISpeechToTextAdapter {
  private isListening = false;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async startListening(
    onResult: (phrase: string) => void,
    _onError: (error: Error) => void
  ): Promise<void> {
    this.isListening = true;
    // Simulate recognition after brief delay for test/demo mode
    setTimeout(() => {
      if (this.isListening) {
        onResult('Check my balance');
        this.isListening = false;
      }
    }, 1500);
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
  }
}
