import {
  GoogleGenerativeAI,
  FunctionDeclaration,
  FunctionDeclarationsTool,
  Content,
} from '@google/generative-ai';
import { config } from '../../config/env';
import {
  GatewayChatRequest,
  GatewayChatResponse,
  GatewayAIToolCall,
} from '../../types/gateway.types';

export class GeminiGatewayClient {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const key = config.GEMINI_API_KEY ? config.GEMINI_API_KEY.trim() : '';
    const isPlaceholder =
      !key ||
      key === 'your_gemini_api_key_here' ||
      key === 'dummy_key' ||
      key.includes('example');

    if (!isPlaceholder) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.genAI);
  }

  public async generateChatResponse(
    request: GatewayChatRequest
  ): Promise<GatewayChatResponse> {
    // If no real API key is configured, provide graceful deterministic response
    if (!this.genAI) {
      return this.generateFallbackResponse(request);
    }

    const systemInstruction = `You are SONORA, a secure, voice-first Stellar wallet companion for blind and visually impaired users.
SECURITY INVARIANTS:
1. You NEVER sign transactions.
2. You NEVER access private keys or recovery phrases.
3. You NEVER authorize payments autonomously.
4. When the user wants to create, setup, or onboard a new wallet, call the createWallet tool to register and fund them on the Stellar testnet.
5. When the user wants to send a payment, help gather the recipient, amount, asset, and memo, then call the preparePayment function.
6. If the recipient is ambiguous, ask the user to clarify.
Provide short, spoken responses.`;

    const functionDeclarations: FunctionDeclaration[] = (request.tools || []).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters as any,
    }));

    const tools: FunctionDeclarationsTool[] =
      functionDeclarations.length > 0 ? [{ functionDeclarations }] : [];

    const model = this.genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      systemInstruction,
      tools: tools.length > 0 ? tools : undefined,
      generationConfig: {
        maxOutputTokens: config.GEMINI_MAX_OUTPUT_TOKENS,
        temperature: 0.2,
      },
    });

    const contents: Content[] = (request.messages || [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      return { text: "Hello, I am SONORA. How can I help you today?" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.GEMINI_REQUEST_TIMEOUT);

    try {
      const result = await model.generateContent({
        contents,
      });

      const candidate = result.response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let text = '';
      const toolCalls: GatewayAIToolCall[] = [];

      for (const part of parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call-gemini-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: part.functionCall.name,
            parameters: (part.functionCall.args as Record<string, unknown>) || {},
          });
        }
      }

      return {
        text: text.trim() || (toolCalls.length > 0 ? 'Executing request...' : ''),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch {
      return this.generateFallbackResponse(request);
    } finally {
      clearTimeout(timeout);
    }
  }

  private generateFallbackResponse(
    request: GatewayChatRequest
  ): GatewayChatResponse {
    const lastUserMsg = [...(request.messages || [])]
      .reverse()
      .find((m) => m.role === 'user');
    const prompt = (lastUserMsg?.content || '').toLowerCase();

    if (
      prompt.includes('create') ||
      prompt.includes('new wallet') ||
      prompt.includes('sign up') ||
      prompt.includes('signup') ||
      prompt.includes('onboard') ||
      prompt.includes('setup') ||
      prompt.includes('set up')
    ) {
      return {
        text: 'Creating your new Stellar wallet and setting up your account on the Stellar Network.',
        toolCalls: [{ id: `mock-${Date.now()}`, name: 'createWallet', parameters: {} }],
        intent: 'create_wallet',
      };
    }

    if (prompt.includes('balance')) {
      return {
        text: 'Checking your Stellar balance now.',
        toolCalls: [{ id: `mock-${Date.now()}`, name: 'getBalances', parameters: {} }],
        intent: 'check_balance',
      };
    }

    if (prompt.includes('address') || prompt.includes('receive')) {
      return {
        text: 'Fetching your Stellar receiving address.',
        toolCalls: [{ id: `mock-${Date.now()}`, name: 'getReceivingAddress', parameters: {} }],
        intent: 'receive_funds',
      };
    }

    return {
      text: 'I am your SONORA wallet companion. You can ask me to check your balance, send funds, or show your address.',
      intent: 'general_query',
    };
  }
}
