import { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server';
import { config } from '../src/config/env';

describe('SONORA AI Gateway - TTS Route & ElevenLabs Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/tts/status returns TTS configuration without requiring auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/tts/status',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.provider).toBe('elevenlabs');
    expect(typeof body.configured).toBe('boolean');
    expect(body.defaultVoiceId).toBeDefined();
  });

  it('POST /v1/tts/synthesize rejects unauthenticated requests with 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tts/synthesize',
      payload: {
        text: 'Hello, welcome to SONORA.',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /v1/tts/synthesize validates missing or empty text payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tts/synthesize',
      headers: {
        authorization: `Bearer ${config.GATEWAY_AUTH_TOKEN}`,
      },
      payload: {
        text: '',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('GET /v1/tts/stream rejects unauthenticated requests with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/tts/stream?text=Hello',
    });

    expect(res.statusCode).toBe(401);
  });
});
