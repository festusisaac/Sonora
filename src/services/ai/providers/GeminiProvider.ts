import { AIProvider } from './AIProvider';
import {
  ConversationTurn,
  ToolDefinition,
  AIResponse,
  AIToolCall,
  AIProviderConfig,
} from '../aiTypes';

/**
 * Google Gemini Provider via SONORA AI Gateway
 *
 * CRITICAL SECURITY INVARIANT:
 * - This client communicates ONLY with the trusted SONORA AI Gateway.
 * - The Gemini API key is NEVER stored or handled on the mobile device.
 * - All tool calls returned by Gemini are treated as requests and independently
 *   validated by the mobile application policy engine.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'GeminiProvider';
  private gatewayUrl: string;
  private gatewayAuthToken: string;
  private timeoutMs: number;

  constructor(config: AIProviderConfig = {}) {
    // Default to local gateway port 3001 (or Android loopback 10.0.2.2:3001 when on emulator)
    this.gatewayUrl = (
      config.gatewayUrl ||
      config.baseUrl ||
      'http://localhost:3001'
    ).replace(/\/+$/, '');
    this.gatewayAuthToken = config.gatewayAuthToken || 'sonora_dev_secret_auth_token_replace_in_prod';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  isConfigured(): boolean {
    return Boolean(this.gatewayUrl && this.gatewayUrl.trim().length > 0);
  }

  getGatewayUrl(): string {
    return this.gatewayUrl;
  }

  async generateResponse(
    messages: ConversationTurn[],
    tools: ToolDefinition[],
    context?: Record<string, unknown>
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gemini Gateway Provider is not configured with a valid gateway URL.');
    }

    const payloadMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
      toolCallId: m.toolCallId,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.gatewayUrl}/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.gatewayAuthToken}`,
          'x-sonora-client': 'mobile-app',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          tools,
          context,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SONORA Gateway error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        text?: string;
        toolCalls?: AIToolCall[];
        intent?: string;
        suggestedQuickReplies?: string[];
      };

      return {
        text: data.text || '',
        toolCalls: data.toolCalls,
        intent: (data.intent as any) || undefined,
        suggestedQuickReplies: data.suggestedQuickReplies,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
