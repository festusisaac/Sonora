import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

/**
 * Speech-To-Text Adapter Interface
 * Decoupled interface allowing seamless switching between native Android/iOS
 * SpeechRecognizer (available in Expo development builds and standalone APKs)
 * and the development mock adapter.
 */
export interface ISpeechToTextAdapter {
  isAvailable(): Promise<boolean>;
  startListening(
    onResult: (phrase: string) => void,
    onError: (error: Error) => void
  ): Promise<void>;
  stopListening(): Promise<void>;
  getName(): string;
}

/**
 * Native Speech-To-Text Adapter
 * Uses `expo-speech-recognition` (backed by Android SpeechRecognizer and iOS SFSpeechRecognizer).
 *
 * NOTE: Native speech recognition requires Android RECORD_AUDIO permission
 * and an Expo development build (`npx expo run:android`) or standalone APK.
 */
export class NativeSpeechToTextAdapter implements ISpeechToTextAdapter {
  private listenerSubscription: { remove: () => void } | null = null;
  private errorSubscription: { remove: () => void } | null = null;

  getName(): string {
    return 'NativeSpeechRecognizer (Android/iOS)';
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!ExpoSpeechRecognitionModule) return false;
      const state = await ExpoSpeechRecognitionModule.getStateAsync();
      return state !== null;
    } catch {
      return false;
    }
  }

  async startListening(
    onResult: (phrase: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error(
          'Microphone permission was denied. Cannot start speech recognition.'
        );
      }

      // Cleanup existing listeners if any
      this.cleanup();

      // Listen for speech results
      this.listenerSubscription = ExpoSpeechRecognitionModule.addListener(
        'result',
        (event) => {
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0]?.transcript || '';
            if (transcript.trim().length > 0) {
              onResult(transcript);
            }
          }
        }
      );

      this.errorSubscription = ExpoSpeechRecognitionModule.addListener(
        'error',
        (event) => {
          onError(new Error(event.message || 'Speech recognition error'));
        }
      );

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
      });
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to start native speech recognition');
      onError(error);
    }
  }

  async stopListening(): Promise<void> {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Ignore stop errors if not listening
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (this.listenerSubscription) {
      this.listenerSubscription.remove();
      this.listenerSubscription = null;
    }
    if (this.errorSubscription) {
      this.errorSubscription.remove();
      this.errorSubscription = null;
    }
  }
}

/**
 * Development / Fallback Speech-To-Text Adapter
 * Provides simulated speech inputs for testing accessibility in development environments
 * where native speech recognition permissions or packages require custom builds.
 */
export class DevSpeechToTextAdapter implements ISpeechToTextAdapter {
  private isListening = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  getName(): string {
    return 'DevSpeechAdapter (Simulated)';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async startListening(
    onResult: (phrase: string) => void,
    _onError: (error: Error) => void
  ): Promise<void> {
    this.isListening = true;
    this.timer = setTimeout(() => {
      if (this.isListening) {
        onResult('Check my balance');
        this.isListening = false;
      }
    }, 1500);
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Resolves the appropriate speech recognition adapter:
 * - If running in a native development build where ExpoSpeechRecognitionModule is linked, returns NativeSpeechToTextAdapter.
 * - Otherwise falls back safely to DevSpeechToTextAdapter.
 */
export function getSpeechToTextAdapter(): ISpeechToTextAdapter {
  try {
    if (
      typeof ExpoSpeechRecognitionModule !== 'undefined' &&
      ExpoSpeechRecognitionModule &&
      typeof ExpoSpeechRecognitionModule.start === 'function'
    ) {
      return new NativeSpeechToTextAdapter();
    }
  } catch {
    // Native module not linked in current runtime (e.g., standard Expo Go)
  }
  return new DevSpeechToTextAdapter();
}
