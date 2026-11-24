import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Service
 * Provides tactile confirmation for blind and visually impaired users.
 */
export class HapticsService {
  /**
   * Selection tick (navigation, tab switch, focus change)
   */
  public static async selection(): Promise<void> {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics may not be supported on emulators or some devices
    }
  }

  /**
   * Medium impact (button press, command trigger)
   */
  public static async impactMedium(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Silently fall back
    }
  }

  /**
   * Heavy impact (important action like confirm payment or warning)
   */
  public static async impactHeavy(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Silently fall back
    }
  }

  /**
   * Notification success (balance retrieved, transaction confirmed)
   */
  public static async notificationSuccess(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Silently fall back
    }
  }

  /**
   * Notification warning (unverified backup, invalid input)
   */
  public static async notificationWarning(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Silently fall back
    }
  }

  /**
   * Notification error (invalid address, network failure)
   */
  public static async notificationError(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Silently fall back
    }
  }
}
