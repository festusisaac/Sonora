import { config } from '../../config/env';

export interface SynthesizeOptions {
  voiceId?: string;
  modelId?: string;
}

export class ElevenLabsClient {
  private apiKey: string;
  private defaultVoiceId: string;
  private defaultModelId = 'eleven_turbo_v2_5'; // Fast, natural, low-latency neural model

  constructor(apiKey?: string, defaultVoiceId?: string) {
    this.apiKey = apiKey ?? config.ELEVENLABS_API_KEY;
    this.defaultVoiceId = defaultVoiceId ?? config.ELEVENLABS_VOICE_ID;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Synthesizes text into high-quality MPEG audio buffer via ElevenLabs API
   */
  public async synthesize(text: string, options?: SynthesizeOptions): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw new Error('ELEVENLABS_NOT_CONFIGURED: Missing ElevenLabs API key in gateway .env');
    }

    const voiceId = options?.voiceId || this.defaultVoiceId;
    const modelId = options?.modelId || this.defaultModelId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
