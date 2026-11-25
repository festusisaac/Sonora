import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import { config, getSafeConfig } from './config/env';
import { authenticateRequest } from './middleware/auth';
import { GeminiGatewayClient } from './services/gemini/geminiClient';
import { ElevenLabsClient } from './services/tts/elevenLabsClient';
import {
  GatewayChatRequest,
  GatewayHealthResponse,
  GatewayStatusResponse,
} from './types/gateway.types';

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'tool']),
      content: z.string(),
      toolCallId: z.string().optional(),
    })
  ).min(1, 'At least one message is required'),
  tools: z.array(z.any()).optional(),
  context: z.record(z.any()).optional(),
});

const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(2000, 'Text exceeds 2000 characters limit'),
  voiceId: z.string().optional(),
});

export function buildServer(): FastifyInstance {
  const app = fastify({
    logger: false,
    bodyLimit: 1048576, // 1MB payload limit
  });

  // CORS Configuration
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST'],
  });

  // Per-client Rate Limiting
  app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'RATE_LIMIT_EXCEEDED: Too many AI requests. Please wait a moment.',
    }),
  });

  const geminiClient = new GeminiGatewayClient();
  const elevenLabsClient = new ElevenLabsClient();

  // Authentication Hook for /v1/ai and /v1/tts routes
  app.addHook('onRequest', authenticateRequest);

  // Health endpoint
  app.get('/v1/health', async (): Promise<GatewayHealthResponse> => {
    return {
      status: 'ok',
      service: 'sonora-ai-gateway',
      timestamp: Date.now(),
      uptime: process.uptime(),
    };
  });

  // Provider status endpoint (safe: zero secrets exposed)
  app.get('/v1/ai/status', async (): Promise<GatewayStatusResponse> => {
    return {
      provider: 'gemini',
      model: config.GEMINI_MODEL,
      configured: geminiClient.isConfigured(),
    };
  });

  // TTS status endpoint
  app.get('/v1/tts/status', async () => {
    return {
      provider: 'elevenlabs',
      configured: elevenLabsClient.isConfigured(),
      defaultVoiceId: config.ELEVENLABS_VOICE_ID,
    };
  });

  // TTS synthesize endpoint (returns MP3 stream)
  app.post('/v1/tts/synthesize', async (request, reply) => {
    const parseResult = ttsRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid TTS request payload',
        details: parseResult.error.format(),
      });
    }

    try {
      const audioBuffer = await elevenLabsClient.synthesize(parseResult.data.text, {
        voiceId: parseResult.data.voiceId,
      });

      return reply
        .header('Content-Type', 'audio/mpeg')
        .header('Content-Length', audioBuffer.length)
        .header('Accept-Ranges', 'bytes')
        .send(audioBuffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ElevenLabs TTS synthesis failed';
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message,
      });
    }
  });

  // Direct audio stream endpoint for native audio players
  app.get('/v1/tts/stream', async (request, reply) => {
    const query = request.query as { text?: string; token?: string; voiceId?: string };
    if (!query.token || query.token !== config.GATEWAY_AUTH_TOKEN) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Valid client authorization token required',
      });
    }

    if (!query.text || query.text.trim().length === 0) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'text query parameter is required',
      });
    }

    try {
      const audioBuffer = await elevenLabsClient.synthesize(query.text, {
        voiceId: query.voiceId,
      });

      return reply
        .header('Content-Type', 'audio/mpeg')
        .header('Content-Length', audioBuffer.length)
        .header('Accept-Ranges', 'bytes')
        .send(audioBuffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ElevenLabs TTS synthesis failed';
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message,
      });
    }
  });

  // Chat completions endpoint
  app.post('/v1/ai/chat', async (request, reply) => {
    const parseResult = chatRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid request payload format',
        details: parseResult.error.format(),
      });
    }

    try {
      const response = await geminiClient.generateChatResponse(
        parseResult.data as GatewayChatRequest
      );
      return reply.send(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal AI gateway processing error';
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'AI Provider communication error. Please try again or use offline commands.',
      });
    }
  });

  // Global error handler: sanitizes errors and prevents internal secret leakage
  app.setErrorHandler((error, request, reply) => {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Error',
      message: error.message || 'An unexpected error occurred.',
    });
  });

  return app;
}

// Start server when executed directly
if (require.main === module) {
  const server = buildServer();
  server.listen({ port: config.PORT, host: config.HOST }, (err, address) => {
    if (err) {
      console.error('Failed to start SONORA AI Gateway:', err);
      process.exit(1);
    }
    console.log(`SONORA AI Gateway running at ${address}`);
  });
}
