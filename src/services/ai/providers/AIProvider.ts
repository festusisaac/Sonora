import {
  ConversationTurn,
  ToolDefinition,
  AIResponse,
} from '../aiTypes';

/**
 * Common Provider Interface for LLM integrations
 * Decouples provider implementation from SONORA wallet orchestration.
 */
export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateResponse(
    messages: ConversationTurn[],
    tools: ToolDefinition[],
    context?: Record<string, unknown>
  ): Promise<AIResponse>;
}
