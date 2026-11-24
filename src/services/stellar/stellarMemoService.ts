import { Memo } from '@stellar/stellar-sdk';
import { MemoDetails } from '../../types/transaction.types';

export class StellarMemoService {
  public static readonly MAX_TEXT_MEMO_BYTES = 28;

  /**
   * Calculates the exact UTF-8 byte length of a string without external libraries.
   */
  public static getUtf8ByteLength(str: string): number {
    return new TextEncoder().encode(str).length;
  }

  /**
   * Validates a memo against Stellar network protocol specifications.
   */
  public static validateMemo(memo?: MemoDetails): { isValid: boolean; error?: string } {
    if (!memo || memo.type === 'none' || !memo.value) {
      return { isValid: true };
    }

    const value = memo.value.trim();

    switch (memo.type) {
      case 'text': {
        const byteLen = this.getUtf8ByteLength(value);
        if (byteLen > this.MAX_TEXT_MEMO_BYTES) {
          return {
            isValid: false,
            error: `Text memo is too long (${byteLen} bytes). Maximum allowed is 28 UTF-8 bytes.`,
          };
        }
        return { isValid: true };
      }

      case 'id': {
        if (!/^\d+$/.test(value)) {
          return {
            isValid: false,
            error: 'Memo ID must be a non-negative integer.',
          };
        }
        try {
          const id = BigInt(value);
          const maxUint64 = 18446744073709551615n; // 2^64 - 1
          if (id < 0n || id > maxUint64) {
            return {
              isValid: false,
              error: 'Memo ID exceeds 64-bit unsigned integer maximum value.',
            };
          }
        } catch {
          return { isValid: false, error: 'Invalid Memo ID number format.' };
        }
        return { isValid: true };
      }

      case 'hash':
      case 'return': {
        if (!/^[0-9a-fA-F]{64}$/.test(value)) {
          return {
            isValid: false,
            error: `${memo.type.toUpperCase()} memo must be exactly 32 bytes (64 hexadecimal characters).`,
          };
        }
        return { isValid: true };
      }

      default:
        return { isValid: false, error: `Unsupported memo type: ${memo.type}` };
    }
  }

  /**
   * Constructs the official Stellar SDK Memo object.
   */
  public static toStellarMemo(memo?: MemoDetails): Memo {
    if (!memo || memo.type === 'none' || !memo.value) {
      return Memo.none();
    }

    const validation = this.validateMemo(memo);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const value = memo.value.trim();

    switch (memo.type) {
      case 'text':
        return Memo.text(value);
      case 'id':
        return Memo.id(value);
      case 'hash':
        return Memo.hash(value);
      case 'return':
        return Memo.return(value);
      default:
        return Memo.none();
    }
  }
}
