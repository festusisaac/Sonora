/**
 * SONORA AI Orchestrator Core Types
 * Defines interfaces, intents, workflow states, tool calling schemas,
 * and security constraints for the AI wallet companion.
 */

export type ConversationRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface AIToolResult {
  toolCallId: string;
  name: string;
  result?: unknown;
  error?: string;
}

export interface ConversationTurn {
  id: string;
  role: ConversationRole;
  content: string;
  toolCalls?: AIToolCall[];
  toolCallId?: string;
  timestamp: number;
}

export type AIIntent =
  | 'check_balance'
  | 'send_payment'
  | 'receive_funds'
  | 'list_contacts'
  | 'find_contact'
  | 'add_contact'
  | 'view_history'
  | 'explain_transaction'
  | 'repeat'
  | 'cancel'
  | 'stop'
  | 'help'
  | 'adjust_speech'
  | 'confirm_choice'
  | 'general_query'
  | 'unknown';

export type AssistantVisualState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type WorkflowStep =
  | 'idle'
  | 'collecting_payment_details'
  | 'disambiguating_recipient'
  | 'awaiting_review'
  | 'awaiting_authorization'
  | 'submitting_payment'
  | 'payment_completed'
  | 'payment_failed'
  | 'adding_contact';

export interface DisambiguationCandidate {
  id: string;
  name: string;
  address: string;
  index: number;
}

export interface PaymentDraftContext {
  recipient?: string;
  recipientName?: string;
  amount?: string;
  asset?: 'XLM' | 'USDC';
  memo?: string;
  fee?: string;
  transactionHash?: string;
  unsignedXdr?: string;
  isDisambiguating?: boolean;
  disambiguationCandidates?: DisambiguationCandidate[];
  missingFields?: ('recipient' | 'amount' | 'asset')[];
}

export interface AIResponse {
  text: string;
  toolCalls?: AIToolCall[];
  intent?: AIIntent;
  suggestedQuickReplies?: string[];
  workflowState?: WorkflowStep;
}

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
}

export interface AIProviderConfig {
  apiKey?: string;
  modelName?: string;
  baseUrl?: string;
  timeoutMs?: number;
}
