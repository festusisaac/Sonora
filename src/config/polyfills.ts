/**
 * SONORA Runtime Polyfills
 *
 * CRITICAL INITIALIZATION ORDER:
 * 1. react-native-get-random-values (provides crypto.getRandomValues)
 * 2. Buffer polyfill
 *
 * Must be imported at the very top of the app entry before any @stellar/stellar-sdk imports.
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Ensure global Buffer is defined for Stellar XDR serialization & base64 operations
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Polyfill btoa / atob if needed
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

if (typeof global.atob === 'undefined') {
  global.atob = (b64Encoded: string) => Buffer.from(b64Encoded, 'base64').toString('binary');
}
