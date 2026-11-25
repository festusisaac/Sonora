import * as Speech from 'expo-speech';

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Spoken voice feedback service using Expo Speech
 * Automatically selects the highest-quality natural voice available on the device.
 */
export class TTSService {
  private static defaultLanguage = 'en-US';
  private static defaultRate = 0.92; // Slightly relaxed rate sounds significantly less robotic
  private static defaultPitch = 0.98; // Warmer, more human frequency
  private static cachedVoiceIdentifier: string | null = null;
  private static isDiscoveringVoice = false;

  /**
   * Discovers the most natural, highest-quality voice installed on the device.
   */
  public static async getBestVoice(): Promise<string | null> {
    if (this.cachedVoiceIdentifier) {
      return this.cachedVoiceIdentifier;
    }
    if (this.isDiscoveringVoice) return null;

    try {
      this.isDiscoveringVoice = true;
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) return null;

      // Prefer English Enhanced or Network Neural voice models
      const naturalVoice =
        voices.find(
          (v) =>
            v.language?.toLowerCase().startsWith('en') &&
            (v.identifier?.toLowerCase().includes('enhanced') ||
              v.identifier?.toLowerCase().includes('neural') ||
              v.identifier?.toLowerCase().includes('network') ||
              v.quality === Speech.VoiceQuality.Enhanced)
        ) ||
        voices.find((v) => v.language?.toLowerCase().startsWith('en-ng')) ||
        voices.find((v) => v.language?.toLowerCase().startsWith('en-us')) ||
        voices[0];

      if (naturalVoice?.identifier) {
        this.cachedVoiceIdentifier = naturalVoice.identifier;
        return naturalVoice.identifier;
      }
    } catch {
      // Fallback silently to system default
    } finally {
      this.isDiscoveringVoice = false;
    }
    return null;
  }

  /**
   * Speak a phrase to the user
   */
  public static async speak(text: string, options?: TTSOptions): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      const voice = options?.voice || (await this.getBestVoice()) || undefined;

      Speech.speak(text, {
        language: options?.language || this.defaultLanguage,
        voice,
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
