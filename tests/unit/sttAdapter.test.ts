import {
  DevSpeechToTextAdapter,
  getSpeechToTextAdapter,
} from '../../src/services/speech/sttAdapter';

describe('Speech Recognition Service Adapter', () => {
  let adapter: DevSpeechToTextAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new DevSpeechToTextAdapter();
  });

  afterEach(async () => {
    await adapter.stopListening();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('provides a valid DevSpeechToTextAdapter implementation', async () => {
    expect(await adapter.isAvailable()).toBe(true);
    expect(adapter.getName()).toContain('DevSpeechAdapter');
  });

  it('returns an adapter instance from the factory', () => {
    const factoryAdapter = getSpeechToTextAdapter();
    expect(factoryAdapter).toBeDefined();
    expect(typeof factoryAdapter.isAvailable).toBe('function');
    expect(typeof factoryAdapter.startListening).toBe('function');
    expect(typeof factoryAdapter.stopListening).toBe('function');
  });

  it('simulates recognized voice command in dev adapter', () => {
    const onResult = jest.fn();
    const onError = jest.fn();

    adapter.startListening(onResult, onError);
    expect(onResult).not.toHaveBeenCalled();

    // Fast-forward timer by 1500ms
    jest.advanceTimersByTime(1500);

    expect(onResult).toHaveBeenCalledWith('Check my balance');
    expect(onError).not.toHaveBeenCalled();
  });
});
