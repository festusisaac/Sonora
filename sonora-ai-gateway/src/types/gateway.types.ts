export interface GatewayChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface GatewayToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
}

export interface GatewayToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, GatewayToolParameterProperty>;
    required?: string[];
  };
}

export interface GatewayAIToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface GatewayChatRequest {
  messages: GatewayChatMessage[];
  tools?: GatewayToolDefinition[];
  context?: Record<string, unknown>;
}

export interface GatewayChatResponse {
  text: string;
  toolCalls?: GatewayAIToolCall[];
  intent?: string;
  suggestedQuickReplies?: string[];
}

export interface GatewayHealthResponse {
  status: 'ok';
  service: 'sonora-ai-gateway';
  timestamp: number;
  uptime: number;
}

export interface GatewayStatusResponse {
  provider: 'gemini';
  model: string;
  configured: boolean;
}
