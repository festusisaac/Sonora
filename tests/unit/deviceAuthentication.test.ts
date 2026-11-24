import * as LocalAuthentication from 'expo-local-authentication';
import { DeviceAuthenticationService } from '../../src/services/security/deviceAuthenticationService';

describe('DeviceAuthenticationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks status and reports supported biometric hardware', async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValueOnce([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const status = await DeviceAuthenticationService.getStatus();
    expect(status.hasHardware).toBe(true);
    expect(status.isEnrolled).toBe(true);
    expect(status.supportedTypes).toEqual(['Fingerprint', 'Facial Recognition']);
  });

  it('authenticates successfully via biometric prompt', async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
      success: true,
    });

    const res = await DeviceAuthenticationService.authenticate('Test Prompt');
    expect(res.success).toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: 'Test Prompt',
        disableDeviceFallback: false,
      })
    );
  });

  it('handles user cancellation gracefully', async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });

    const res = await DeviceAuthenticationService.authenticate();
    expect(res.success).toBe(false);
    expect(res.error).toContain('cancelled');
  });

  it('allows pass-through if device has no biometrics/PIN enrolled', async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(false);

    const res = await DeviceAuthenticationService.authenticate();
    expect(res.success).toBe(true);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });
});
