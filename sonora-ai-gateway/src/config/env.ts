import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GEMINI_REQUEST_TIMEOUT: z.coerce.number().default(15000),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().default(1024),
  GATEWAY_AUTH_TOKEN: z.string().default('sonora_dev_secret_auth_token_replace_in_prod'),
  RATE_LIMIT_MAX: z.coerce.number().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid Gateway environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

/**
 * Returns safe environment configuration without sensitive API keys
 */
export function getSafeConfig() {
  return {
    port: config.PORT,
    host: config.HOST,
    model: config.GEMINI_MODEL,
    hasApiKey: Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim().length > 0),
    requestTimeoutMs: config.GEMINI_REQUEST_TIMEOUT,
    maxTokens: config.GEMINI_MAX_OUTPUT_TOKENS,
  };
}
