import { ProviderFactory } from '../../src/services/ai/providers/ProviderFactory';
import { MockAIProvider } from '../../src/services/ai/providers/MockAIProvider';
import { OpenAIProvider } from '../../src/services/ai/providers/OpenAIProvider';
import { GeminiProvider } from '../../src/services/ai/providers/GeminiProvider';
import { WALLET_TOOLS } from '../../src/services/ai/toolRegistry';
import { ConversationTurn } from '../../src/services/ai/aiTypes';

describe('AI Providers & Factory', () => {
  beforeEach(() => {
    ProviderFactory.getInstance().resetToMock();
  });

  test('ProviderFactory defaults to MockAIProvider when unconfigured', () => {
    const factory = ProviderFactory.getInstance();
    const provider = factory.getProvider();
    expect(provider).toBeInstanceOf(MockAIProvider);
    expect(factory.getProviderType()).toBe('mock');
    expect(provider.isConfigured()).toBe(true);
  });

  test('ProviderFactory falls back to MockAIProvider if provider is set to offline', () => {
    const factory = ProviderFactory.getInstance();
    factory.configureProvider('openai', { apiKey: '' });
    expect(factory.getProviderType()).toBe('mock');
    expect(factory.getProvider()).toBeInstanceOf(MockAIProvider);

    factory.configureProvider('gemini', { gatewayUrl: 'offline' });
    expect(factory.getProviderType()).toBe('mock');
    expect(factory.getProvider()).toBeInstanceOf(MockAIProvider);
  });

  test('ProviderFactory instantiates OpenAIProvider when valid key is provided', () => {
    const factory = ProviderFactory.getInstance();
    const provider = factory.configureProvider('openai', { apiKey: 'sk-test-key-12345' });
    expect(factory.getProviderType()).toBe('openai');
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.isConfigured()).toBe(true);
  });

  test('ProviderFactory instantiates GeminiProvider targeting the SONORA AI Gateway', () => {
    const factory = ProviderFactory.getInstance();
    const provider = factory.configureProvider('gemini', { gatewayUrl: 'http://localhost:3001' });
    expect(factory.getProviderType()).toBe('gemini');
    expect(provider).toBeInstanceOf(GeminiProvider);
    expect(provider.isConfigured()).toBe(true);
    expect((provider as GeminiProvider).getGatewayUrl()).toBe('http://localhost:3001');
  });

  test('MockAIProvider resolves balance inquiry with getBalances tool call', async () => {
    const mock = new MockAIProvider();
    const messages: ConversationTurn[] = [
      { id: '1', role: 'user', content: 'What is my current balance?', timestamp: Date.now() },
    ];
    const res = await mock.generateResponse(messages, WALLET_TOOLS);
    expect(res.intent).toBe('check_balance');
    expect(res.toolCalls).toBeDefined();
    expect(res.toolCalls?.[0]?.name).toBe('getBalances');
    expect(res.suggestedQuickReplies).toContain('Send XLM');
  });

  test('MockAIProvider resolves receive funds inquiry with getReceivingAddress tool call', async () => {
    const mock = new MockAIProvider();
    const messages: ConversationTurn[] = [
      { id: '1', role: 'user', content: 'Show my receiving address', timestamp: Date.now() },
    ];
    const res = await mock.generateResponse(messages, WALLET_TOOLS);
    expect(res.intent).toBe('receive_funds');
    expect(res.toolCalls?.[0]?.name).toBe('getReceivingAddress');
  });

  test('MockAIProvider resolves contact listing inquiry with listContacts tool call', async () => {
    const mock = new MockAIProvider();
    const messages: ConversationTurn[] = [
      { id: '1', role: 'user', content: 'Show my contacts list', timestamp: Date.now() },
    ];
    const res = await mock.generateResponse(messages, WALLET_TOOLS);
    expect(res.intent).toBe('list_contacts');
    expect(res.toolCalls?.[0]?.name).toBe('listContacts');
  });

  test('MockAIProvider resolves transaction history inquiry with getTransactionHistory tool call', async () => {
    const mock = new MockAIProvider();
    const messages: ConversationTurn[] = [
      { id: '1', role: 'user', content: 'Show my recent history', timestamp: Date.now() },
    ];
    const res = await mock.generateResponse(messages, WALLET_TOOLS);
    expect(res.intent).toBe('view_history');
    expect(res.toolCalls?.[0]?.name).toBe('getTransactionHistory');
  });

  test('MockAIProvider provides spoken help when asked', async () => {
    const mock = new MockAIProvider();
    const messages: ConversationTurn[] = [
      { id: '1', role: 'user', content: 'What can you do? Help me.', timestamp: Date.now() },
    ];
    const res = await mock.generateResponse(messages, WALLET_TOOLS);
    expect(res.intent).toBe('help');
    expect(res.text).toContain('SONORA');
  });
});
