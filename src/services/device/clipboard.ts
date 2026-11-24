import * as Clipboard from 'expo-clipboard';

/**
 * Safe Clipboard Abstraction
 */
export class ClipboardService {
  public static async copyText(text: string): Promise<void> {
    await Clipboard.setStringAsync(text);
  }

  public static async getClipboardText(): Promise<string> {
    return Clipboard.getStringAsync();
  }
}
