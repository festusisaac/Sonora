/**
 * SONORA Runtime Polyfills
 *
 * CRITICAL INITIALIZATION ORDER:
 * 1. react-native-get-random-values (provides crypto.getRandomValues)
 *
 * Configured for `@stellar/stellar-sdk` v17+.
 * Note: `@stellar/stellar-sdk` v17 uses standard Uint8Array and @noble/ed25519
 * with native Web Crypto, removing legacy Node.js Buffer requirements.
 *
 * Must be imported at the very top of the app entry before any @stellar/stellar-sdk imports.
 */

import 'react-native-get-random-values';

// Polyfill btoa / atob using standard typed arrays if missing in older environments
const globalScope = globalThis as unknown as {
  btoa?: (str: string) => string;
  atob?: (str: string) => string;
};

if (typeof globalScope.btoa === 'undefined') {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  globalScope.btoa = (input: string) => {
    let str = input;
    let output = '';
    for (
      let block = 0, charCode, i = 0, map = chars;
      str.charAt(i | 0) || ((map = '='), i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4));
      if (charCode > 0xff) {
        throw new Error(
          "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range."
        );
      }
      block = (block << 8) | charCode;
    }
    return output;
  };
}

if (typeof globalScope.atob === 'undefined') {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  globalScope.atob = (input: string) => {
    const str = String(input).replace(/=+$/, '');
    if (str.length % 4 === 1) {
      throw new Error(
        "'atob' failed: The string to be decoded is not correctly encoded."
      );
    }
    let output = '';
    for (
      let bc = 0, bs = 0, buffer, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer &&
      ((bs = bc % 4 ? bs * 64 + buffer : buffer),
      bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  };
}
