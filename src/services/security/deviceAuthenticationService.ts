import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricAuthStatus } from '../../types/wallet';

/**
 * Device Authentication Service
 *
 * Wraps expo-local-authentication to manage hardware biometric verification
 * (fingerprint, face unlock) and device passcode fallback.
 *
 * ARCHITECTURAL CLARITY:
 * - Biometric authentication is exclusively used as an authorization gate
 *   to access Android Keystore / iOS Keychain secrets.
 * - Biometrics DO NOT create cryptographic signatures on the Stellar network.
 * - Stellar transaction signing is performed separately by Ed25519 mathematical
 *   operations using the momentarily retrieved secret key.
 */
export class DeviceAuthenticationService {
  /**
   * Checks the hardware capabilities and biometric enrollment status on this device.
   */
  public static async getStatus(): Promise<BiometricAuthStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const typeNames: string[] = [];
      types.forEach((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            typeNames.push('Fingerprint');
            break;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            typeNames.push('Facial Recognition');
            break;
          case LocalAuthentication.AuthenticationType.IRIS:
            typeNames.push('Iris');
            break;
          default:
            typeNames.push('Biometrics');
        }
      });

      return {
        hasHardware,
        isEnrolled,
        supportedTypes: typeNames,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Prompts the user to authenticate using biometric sensor or device passcode fallback.
   */
  public static async authenticate(
    promptMessage = 'Authorize wallet access with biometrics or device PIN'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        // Device does not have biometrics or PIN enrolled; allow pass-through on dev/unsecured devices
        return { success: true };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allows device PIN/pattern as fallback
      });

      if (result.success) {
        return { success: true };
      }

      if (result.error === 'user_cancel' || result.error === 'app_cancel') {
        return { success: false, error: 'Authentication cancelled by user.' };
      }

      return {
        success: false,
        error: result.warning || 'Authentication failed. Please try again.',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Biometric verification error.',
      };
    }
  }
}
