export interface StellarAccountInfo {
  accountId: string;
  sequence: string;
  subentryCount: number;
  balances: {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
    buying_liabilities?: string;
    selling_liabilities?: string;
    is_authorized?: boolean;
  }[];
  flags?: {
    auth_required?: boolean;
    auth_revocable?: boolean;
    auth_immutable?: boolean;
    auth_clawback_enabled?: boolean;
  };
}

export interface AddressValidationResult {
  isValid: boolean;
  address: string;
  error?: string;
}

export interface AccountReserveDetails {
  totalXlmStroops: bigint;
  minimumReserveStroops: bigint;
  subentryCount: number;
  sellingLiabilitiesStroops: bigint;
  availableXlmStroops: bigint;
  maxSpendableXlmStroops: bigint; // available - base fee
  totalXlm: string;
  minimumReserve: string;
  availableXlm: string;
  maxSpendableXlm: string;
}

export interface RecipientValidationResult {
  isValidAddress: boolean;
  exists: boolean;
  canReceiveAsset: boolean;
  requiresAccountCreation: boolean;
  destinationAccountInfo?: StellarAccountInfo;
  hasTrustline?: boolean;
  isTrustlineAuthorized?: boolean;
  warnings: string[];
  error?: string;
}

export interface FeeStatsResult {
  minFeeStroops: string;
  modeFeeStroops: string;
  recommendedFeeStroops: string;
  maxSafeFeeStroops: string;
}
