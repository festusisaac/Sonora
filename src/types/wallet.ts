export interface AssetBalance {
  code: string;
  balance: string;
  issuer?: string;
  buyingLiabilities?: string;
  sellingLiabilities?: string;
}

export type NetworkType = 'TESTNET' | 'CUSTOM';

export type WalletConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface WalletState {
  status: WalletConnectionStatus;
  publicKey: string | null;
  network: NetworkType;
  balances: AssetBalance[];
  lastUpdated: number | null;
  errorMessage: string | null;
}
