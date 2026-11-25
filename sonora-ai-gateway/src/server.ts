import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import { config, getSafeConfig } from './config/env';
import { authenticateRequest } from './middleware/auth';
import { GeminiGatewayClient } from './services/gemini/geminiClient';
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

  // Authentication Hook for /v1/ai routes
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
