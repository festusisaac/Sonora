import supertest from 'supertest';
import { buildServer } from '../src/server';
import { config } from '../src/config/env';

describe('SONORA AI Gateway - Core Routes & Functionality', () => {
  let app: any;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('GET /v1/health returns 200 with service health info', async () => {
    const res = await supertest(app.server).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('sonora-ai-gateway');
    expect(res.body.timestamp).toBeDefined();
  });

  test('GET /v1/ai/status returns provider info safely', async () => {
    const res = await supertest(app.server).get('/v1/ai/status');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('gemini');
    expect(res.body.model).toBeDefined();
    expect(res.body.configured).toBeDefined();
    // Invariant: MUST NOT expose API key
    expect(res.body.apiKey).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(config.GEMINI_API_KEY || 'fake_key');
  });

  test('POST /v1/ai/chat rejects unauthenticated requests with 401', async () => {
    const res = await supertest(app.server)
      .post('/v1/ai/chat')
      .send({ messages: [{ role: 'user', content: 'Hello' }] });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('POST /v1/ai/chat rejects invalid authentication tokens with 401', async () => {
    const res = await supertest(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', 'Bearer invalid_token_12345')
      .send({ messages: [{ role: 'user', content: 'Hello' }] });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('UNAUTHORIZED');
  });

  test('POST /v1/ai/chat accepts valid authentication token and processes chat', async () => {
    const res = await supertest(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${config.GATEWAY_AUTH_TOKEN}`)
      .send({
        messages: [{ role: 'user', content: 'What is my balance?' }],
        tools: [
          {
            name: 'getBalances',
            description: 'Get user balances',
            parameters: { type: 'object', properties: {} },
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBeDefined();
  });

  test('POST /v1/ai/chat rejects empty messages payload with 400', async () => {
    const res = await supertest(app.server)
      .post('/v1/ai/chat')
      .set('Authorization', `Bearer ${config.GATEWAY_AUTH_TOKEN}`)
      .send({ messages: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Bad Request');
  });
});
