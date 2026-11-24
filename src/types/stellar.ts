export interface StellarAccountInfo {
  accountId: string;
  sequence: string;
  subentryCount: number;
  balances: {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }[];
}

export interface AddressValidationResult {
  isValid: boolean;
  address: string;
  error?: string;
}
