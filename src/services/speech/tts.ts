import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

function resolveDefaultGatewayUrl(): string {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3001`;
    }
  } catch {
    // ignore
  }
  return 'http://localhost:3001';
}

/**
 * Spoken voice feedback service for SONORA
 *
 * Tier 1: ElevenLabs Neural Audio via SONORA AI Gateway (ultra-lifelike, warm, human tone)
 * Tier 2: On-device Enhanced Android Speech (zero network dependency, instant fail-safe)
 *
 * INVARIANT: Blind users must NEVER be stranded in silence.
 * If network, ElevenLabs credits, or gateway fail, native TTS triggers immediately.
 */
export class TTSService {
  private static defaultLanguage = 'en-US';
  private static defaultRate = 0.92; // Slightly relaxed rate sounds significantly less robotic
  private static defaultPitch = 0.98; // Warmer, more human frequency
  private static cachedVoiceIdentifier: string | null = null;
  private static isDiscoveringVoice = false;

  private static currentSound: Audio.Sound | null = null;
  private static isPlayingAudioSound = false;
  private static gatewayToken = 'sonora_dev_secret_auth_token_replace_in_prod';

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
   * Speak a phrase to the user.
   * Attempts ElevenLabs via AI Gateway first, falls back seamlessly to device TTS.
   */
  public static async speak(text: string, options?: TTSOptions): Promise<void> {
    try {
      // Always stop previous audio first
      await this.stop();

      // Attempt Tier 1: ElevenLabs synthesis via Gateway
      const playedViaElevenLabs = await this.playElevenLabsAudio(text, options);
      if (playedViaElevenLabs) {
        return;
      }
    } catch {
      // Silence warning, proceed to Tier 2 fallback immediately
    }

    // Tier 2: Instant native device TTS fallback
    this.speakWithDeviceTTS(text, options);
  }

  /**
   * Streams and plays ElevenLabs synthesized audio from the gateway
   */
  private static async playElevenLabsAudio(
    text: string,
    options?: TTSOptions
  ): Promise<boolean> {
    try {
      const gatewayUrl = resolveDefaultGatewayUrl();
      const encodedText = encodeURIComponent(text);
      const streamUrl = `${gatewayUrl}/v1/tts/stream?token=${this.gatewayToken}&text=${encodedText}`;

      // Set audio mode for mobile playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.isPlayingAudioSound = false;
            options?.onDone?.();
            sound.unloadAsync().catch(() => {});
          }
        }
      );

      this.currentSound = sound;
      this.isPlayingAudioSound = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fallback: Native device TTS
   */
  private static async speakWithDeviceTTS(text: string, options?: TTSOptions): Promise<void> {
    try {
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
    }
  }

  /**
   * Stop any current spoken audio immediately
   */
  public static async stop(): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync().catch(() => {});
        await this.currentSound.unloadAsync().catch(() => {});
        this.currentSound = null;
      }
      this.isPlayingAudioSound = false;
      await Speech.stop().catch(() => {});
    } catch {
      // Ignore errors when stopping
    }
  }

  /**
   * Check if speech is currently playing
   */
  public static async isSpeaking(): Promise<boolean> {
    if (this.isPlayingAudioSound) {
      return true;
    }
    return Speech.isSpeakingAsync();
  }
}
