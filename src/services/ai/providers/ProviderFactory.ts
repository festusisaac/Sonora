import { AIProvider } from './AIProvider';
import { MockAIProvider } from './MockAIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { AIProviderConfig } from '../aiTypes';

export type ProviderType = 'mock' | 'openai' | 'gemini';

/**
 * ProviderFactory
 *
 * Manages provider instantiation and defaults gracefully to MockAIProvider
 * when no valid API key is present or when offline.
 */
export class ProviderFactory {
  private static instance: ProviderFactory;
  private currentProvider: AIProvider;
  private providerType: ProviderType = 'gemini';

  private constructor() {
    this.currentProvider = new GeminiProvider();
  }

  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  public getProvider(): AIProvider {
    return this.currentProvider;
  }

  public getProviderType(): ProviderType {
    return this.providerType;
  }

  public configureProvider(
    type: ProviderType,
    config: AIProviderConfig = {}
  ): AIProvider {
    this.providerType = type;

    switch (type) {
      case 'openai':
        if (config.apiKey && config.apiKey.trim().length > 0) {
          this.currentProvider = new OpenAIProvider(config);
        } else {
          this.currentProvider = new MockAIProvider();
          this.providerType = 'mock';
        }
        break;

      case 'gemini':
        if (config.gatewayUrl === 'offline' || config.baseUrl === 'offline') {
          this.currentProvider = new MockAIProvider();
          this.providerType = 'mock';
        } else {
          this.currentProvider = new GeminiProvider(config);
        }
        break;

      case 'mock':
      default:
        this.currentProvider = new MockAIProvider();
        this.providerType = 'mock';
        break;
    }

    return this.currentProvider;
  }

  public resetToMock(): void {
    this.providerType = 'mock';
    this.currentProvider = new MockAIProvider();
  }
}
