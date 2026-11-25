import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/env';

/**
 * Authentication middleware for SONORA AI Gateway
 * Verifies Bearer token or x-sonora-auth-token header
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Allow health check and status without auth token
  if (
    request.url === '/v1/health' ||
    request.url === '/v1/ai/status' ||
    request.url === '/v1/tts/status' ||
    request.url.startsWith('/v1/tts/stream')
  ) {
    return;
  }

  const authHeader = request.headers.authorization;
  const customHeader = request.headers['x-sonora-auth-token'];

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  }

  if (!token || token !== config.GATEWAY_AUTH_TOKEN) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'UNAUTHORIZED: Valid client authorization token required.',
    });
  }
}
