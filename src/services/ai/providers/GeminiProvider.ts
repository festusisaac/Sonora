import Constants from 'expo-constants';
import { AIProvider } from './AIProvider';
import { MockAIProvider } from './MockAIProvider';
import {
  ConversationTurn,
  ToolDefinition,
  AIResponse,
  AIToolCall,
  AIProviderConfig,
} from '../aiTypes';

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
  // Default to developer's local network Wi-Fi IP so physical Android APKs can reach the gateway
  return 'http://192.168.1.104:3001';
}

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
  private fallbackProvider: MockAIProvider;

  constructor(config: AIProviderConfig = {}) {
    this.gatewayUrl = (
      config.gatewayUrl ||
      config.baseUrl ||
      resolveDefaultGatewayUrl()
    ).replace(/\/+$/, '');
    this.gatewayAuthToken = config.gatewayAuthToken || 'sonora_dev_secret_auth_token_replace_in_prod';
    this.timeoutMs = config.timeoutMs || 15000;
    this.fallbackProvider = new MockAIProvider();
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
      return this.fallbackProvider.generateResponse(messages, tools, context);
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
        // Fall back gracefully to conversational handler
        return this.fallbackProvider.generateResponse(messages, tools, context);
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
    } catch {
      // If gateway is offline, unreachable on LAN, or times out, seamlessly fall back
      return this.fallbackProvider.generateResponse(messages, tools, context);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
