import { useWalletStore } from '../../src/store/walletStore';

describe('Wallet Zustand Store', () => {
  beforeEach(() => {
    useWalletStore.getState().resetWallet();
  });

  it('should initialize with disconnected state and empty balances', () => {
    const state = useWalletStore.getState();
    expect(state.status).toBe('idle');
    expect(state.publicKey).toBeNull();
    expect(state.balances).toEqual([]);
    expect(state.network).toBe('TESTNET');
  });

  it('should update public address and transition status', () => {
    const testAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    useWalletStore.getState().setPublicKey(testAddress);

    const state = useWalletStore.getState();
    expect(state.publicKey).toBe(testAddress);
    expect(state.status).toBe('connected');
  });

  it('should set balances and update timestamp', () => {
    const balances = [
      { code: 'XLM', balance: '120.50' },
      { code: 'USDC', balance: '50.00' },
    ];
    useWalletStore.getState().setBalances(balances);

    const state = useWalletStore.getState();
    expect(state.balances).toHaveLength(2);
    expect(state.balances[0].code).toBe('XLM');
    expect(state.lastUpdated).toBeGreaterThan(0);
  });
});
