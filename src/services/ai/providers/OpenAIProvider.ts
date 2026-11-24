import { AIProvider } from './AIProvider';
import {
  ConversationTurn,
  ToolDefinition,
  AIResponse,
  AIToolCall,
  AIProviderConfig,
} from '../aiTypes';

/**
 * OpenAI Provider implementation
 * Uses official Chat Completions API with Function Calling / Tool calls.
 * Sanitizes system prompt to ensure private keys are NEVER handled.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAIProvider';
  private apiKey: string;
  private modelName: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: AIProviderConfig = {}) {
    this.apiKey = config.apiKey || '';
    this.modelName = config.modelName || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateResponse(
    messages: ConversationTurn[],
    tools: ToolDefinition[],
    context?: Record<string, unknown>
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI Provider is not configured with an API key.');
    }

    const systemPrompt = `You are SONORA, a secure, voice-first Stellar wallet companion for blind and visually impaired users.
Your voice tone is warm, calm, clear, and reassuring.
SECURITY INVARIANTS:
1. You NEVER sign transactions.
2. You NEVER access private keys or recovery phrases.
3. You NEVER authorize payments autonomously.
4. When the user wants to send a payment, help gather the recipient, amount, asset, and memo, then use the preparePayment tool.
5. If the recipient is ambiguous, ask the user to choose explicitly.
Keep your spoken responses concise and accessible.`;

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'tool' as const,
            content: m.content,
            tool_call_id: m.toolCallId || 'call_default',
          };
        }
        return {
          role: m.role as 'user' | 'assistant',
          content: m.content,
        };
      }),
    ];

    const openAiTools = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: openAiMessages,
          tools: openAiTools.length > 0 ? openAiTools : undefined,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) {
        throw new Error('OpenAI API returned empty response choice.');
      }

      const toolCalls: AIToolCall[] = (choice.tool_calls || []).map(
        (tc: { id: string; function: { name: string; arguments: string } }) => {
          let parsedParams = {};
          try {
            parsedParams = JSON.parse(tc.function.arguments || '{}');
          } catch {
            parsedParams = {};
          }
          return {
            id: tc.id,
            name: tc.function.name,
            parameters: parsedParams,
          };
        }
      );

      return {
        text: choice.content || (toolCalls.length > 0 ? 'Executing request...' : ''),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
