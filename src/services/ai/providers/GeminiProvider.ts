import { AIProvider } from './AIProvider';
import {
  ConversationTurn,
  ToolDefinition,
  AIResponse,
  AIToolCall,
  AIProviderConfig,
} from '../aiTypes';

/**
 * Google Gemini Provider implementation
 * Uses Gemini REST API with Function Declarations.
 * Strictly adheres to non-custodial constraints.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'GeminiProvider';
  private apiKey: string;
  private modelName: string;
  private timeoutMs: number;

  constructor(config: AIProviderConfig = {}) {
    this.apiKey = config.apiKey || '';
    this.modelName = config.modelName || 'gemini-1.5-flash';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateResponse(
    messages: ConversationTurn[],
    tools: ToolDefinition[],
    _context?: Record<string, unknown>
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gemini Provider is not configured with an API key.');
    }

    const systemInstruction = {
      role: 'system',
      parts: [
        {
          text: `You are SONORA, a secure voice wallet companion for blind and visually impaired users.
SECURITY INVARIANTS:
1. You NEVER sign transactions.
2. You NEVER access private keys or recovery phrases.
3. You NEVER authorize payments autonomously.
4. When the user wants to send a payment, gather details and call preparePayment.
Provide short, spoken responses.`,
        },
      ],
    };

    const contents = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const functionDeclarations = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction,
          contents,
          tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
          generationConfig: {
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let text = '';
      const toolCalls: AIToolCall[] = [];

      for (const part of parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `gemini-call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: part.functionCall.name,
            parameters: part.functionCall.args || {},
          });
        }
      }

      return {
        text: text.trim() || (toolCalls.length > 0 ? 'Executing request...' : ''),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
