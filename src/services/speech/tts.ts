import * as Speech from 'expo-speech';

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Spoken voice feedback service using Expo Speech
 */
export class TTSService {
  private static defaultLanguage = 'en-US';
  private static defaultRate = 1.0;
  private static defaultPitch = 1.0;

  /**
   * Speak a phrase to the user
   */
  public static async speak(text: string, options?: TTSOptions): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      Speech.speak(text, {
        language: options?.language || this.defaultLanguage,
        pitch: options?.pitch || this.defaultPitch,
        rate: options?.rate || this.defaultRate,
        onDone: options?.onDone,
        onError: (err) => {
          if (options?.onError) {
            options.onError(new Error(String(err)));
          }
        },
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('TTS Speech error');
      options?.onError?.(error);
      throw error;
    }
  }

  /**
   * Stop any current spoken audio immediately
   */
  public static async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // Ignore errors when stopping
    }
  }

  /**
   * Check if speech is currently playing
   */
  public static async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }
}
