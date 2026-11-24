import { useQuery } from '@tanstack/react-query';
import { fetchStellarAccount } from '../services/stellar/account';
import { useWalletStore } from '../store/walletStore';

export function useStellarAccount(publicKey: string | null) {
  const { setBalances, setStatus, setError } = useWalletStore();

  return useQuery({
    queryKey: ['stellarAccount', publicKey],
    queryFn: async () => {
      if (!publicKey) return null;
      try {
        setStatus('connecting');
        const data = await fetchStellarAccount(publicKey);
        setBalances(data.balances);
        setStatus('connected');
        return data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to query Stellar account';
        setError(message);
        throw err;
      }
    },
    enabled: !!publicKey,
  });
}
