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
  | 'locked'
  | 'error';

export interface WalletState {
  status: WalletConnectionStatus;
  publicKey: string | null;
  network: NetworkType;
  balances: AssetBalance[];
  isBackedUp: boolean;
  isUnlocked: boolean;
  lastUpdated: number | null;
  errorMessage: string | null;
}

export interface DerivedKeypair {
  publicKey: string;
  secretKey: string;
  accountIndex: number;
  derivationPath: string;
}

export interface WalletMetadata {
  publicKey: string;
  createdAt: number;
  isBackedUp: boolean;
  backupVerifiedAt?: number;
  accountIndex: number;
  network: NetworkType;
}

export interface BackupChallengeItem {
  index: number; // 1-based index (e.g. 4 for 4th word)
  word: string;  // Correct word
  options: string[]; // 3-4 options for accessible multi-choice verification
}

export interface BackupChallenge {
  challengeItems: BackupChallengeItem[];
}

export interface BiometricAuthStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
}

export interface FriendbotResponse {
  success: boolean;
  message: string;
  txHash?: string;
}
