import { StellarAssetService } from '../../src/services/stellar/stellarAssetService';
import { AssetIdentifier } from '../../src/types/transaction.types';
import { StellarAccountInfo } from '../../src/types/stellar';

describe('StellarAssetService', () => {
  const validIssuer = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('validates native XLM asset', () => {
    const asset: AssetIdentifier = { code: 'XLM', isNative: true };
    const val = StellarAssetService.validateAssetIdentifier(asset);
    expect(val.isValid).toBe(true);

    const sdkAsset = StellarAssetService.toStellarAsset(asset);
    expect(sdkAsset.isNative()).toBe(true);
  });

  it('validates issued alphanumeric assets with issuer', () => {
    const asset: AssetIdentifier = {
      code: 'USDC',
      issuer: validIssuer,
      isNative: false,
    };
    const val = StellarAssetService.validateAssetIdentifier(asset);
    expect(val.isValid).toBe(true);

    const sdkAsset = StellarAssetService.toStellarAsset(asset);
    expect(sdkAsset.isNative()).toBe(false);
    expect(sdkAsset.getCode()).toBe('USDC');
    expect(sdkAsset.getIssuer()).toBe(validIssuer);
  });

  it('rejects issued assets missing an issuer address', () => {
    const asset: AssetIdentifier = { code: 'USDC', isNative: false };
    const val = StellarAssetService.validateAssetIdentifier(asset);
    expect(val.isValid).toBe(false);
    expect(val.error).toContain('requires an issuer');
  });

  it('rejects invalid asset code formats (empty or > 12 chars)', () => {
    const assetEmpty: AssetIdentifier = { code: '', isNative: false };
    expect(StellarAssetService.validateAssetIdentifier(assetEmpty).isValid).toBe(false);

    const assetTooLong: AssetIdentifier = {
      code: 'TOOLONGASSETCODE123',
      issuer: validIssuer,
      isNative: false,
    };
    expect(StellarAssetService.validateAssetIdentifier(assetTooLong).isValid).toBe(false);
  });

  it('checks trustline presence and authorization flags', () => {
    const accountInfo: StellarAccountInfo = {
      accountId: 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6',
      sequence: '1',
      subentryCount: 2,
      balances: [
        { asset_type: 'native', balance: '100.0' },
        {
          asset_type: 'credit_alphanum4',
          asset_code: 'USDC',
          asset_issuer: validIssuer,
          balance: '50.0',
          is_authorized: true,
        },
        {
          asset_type: 'credit_alphanum4',
          asset_code: 'FROZEN',
          asset_issuer: validIssuer,
          balance: '10.0',
          is_authorized: false,
        },
      ],
    };

    const usdcTrust = StellarAssetService.hasAuthorizedTrustline(
      accountInfo,
      'USDC',
      validIssuer
    );
    expect(usdcTrust.hasTrustline).toBe(true);
    expect(usdcTrust.isAuthorized).toBe(true);

    const frozenTrust = StellarAssetService.hasAuthorizedTrustline(
      accountInfo,
      'FROZEN',
      validIssuer
    );
    expect(frozenTrust.hasTrustline).toBe(true);
    expect(frozenTrust.isAuthorized).toBe(false);

    const missingTrust = StellarAssetService.hasAuthorizedTrustline(
      accountInfo,
      'UNKNOWN',
      validIssuer
    );
    expect(missingTrust.hasTrustline).toBe(false);
  });
});
