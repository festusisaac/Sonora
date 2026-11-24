# SONORA Security Specification & Guidelines

## 1. Mandatory Security Rules

Every contributor and agent working on SONORA must strictly adhere to the following principles:

1. **No Real Funds:** SONORA Phase 1 and 2 operate strictly on the Stellar Testnet. Mainnet configuration is disabled.
2. **No Private Keys in Ordinary Storage:** Never store secret keys (`S...`), recovery seeds, or encryption keys in `AsyncStorage`, SQLite, Zustand stores, plaintext files, or Git.
3. **Hardware-Backed Protection:** All sensitive credentials must reside in `expo-secure-store` utilizing hardware-backed Android Keystore / iOS Keychain.
4. **No Automated Payment Submission:** Payments must never be sent automatically upon voice recognition.
5. **No AI-Authorized Signing:** Machine learning or NLP agents can only draft payments for user review. They can never authorize or sign transactions.
6. **Explicit User Confirmation:** A transaction requires explicit multi-modal confirmation (voice confirmation + tactile button press).
7. **No Exposing Secrets in Logs:** Console statements and telemetry must never output private keys, seeds, or authentication tokens.
8. **No Hardcoded API Secrets:** Sensitive keys must be passed through environment variables.
9. **Strict Recipient Validation:** Syntactic validity does not prove recipient authenticity. The wallet must provide clear spoken feedback of the recipient address and prompt for confirmation.
10. **Self-Custodial Architecture:** Signing takes place entirely on the user's device. No custodial backend is utilized.

---

## 2. Threat Model & Mitigations

| Threat | Risk Level | Mitigation in SONORA |
|---|---|---|
| Misheard Voice Command | High | Audio playback of recognized amount and recipient; required explicit confirmation |
| Malicious Contact Substitution | High | Visual & spoken confirmation of recipient address before signing |
| Device Memory Inspection | Medium | Private keys loaded only momentarily in memory during signing; not stored in global state |
| Plaintext Backup Leakage | Critical | SecureStore hardware-backed keystore with `AFTER_FIRST_UNLOCK` access policy |
| Accidental Mainnet Transaction | Critical | Hardcoded Testnet Horizon URL and network passphrase validation in Phase 1 |

---

## 3. Android Keystore & Biometric Security Model

### Hardware-Backed Android Keystore
- Android Keystore generates asymmetric or AES-256 keys inside the Trusted Execution Environment (TEE) or StrongBox Keymaster.
- Even with root access, private keys stored in the Android Keystore cannot be extracted directly in plaintext.
- `SecureStorageService` wraps `expo-secure-store`, applying a dedicated namespace (`sonora_sec_`) and hardware-level isolation.

### Biometric Presence vs. Cryptographic Signing
A critical architectural boundary exists between biometric authentication and cryptographic transaction signing:
1. **Biometric Authentication (Android BiometricPrompt):** Proves the physical presence and consent of the authenticated user to unlock access to the Keystore. It provides local authorization.
2. **Cryptographic Signing (Ed25519):** Computes a mathematical digital signature over the SHA-256 transaction hash using the Stellar secret key (`Keypair.sign`).
- Biometric verification **never** replaces or signs the transaction directly.
- The workflow is:
  `[Voice Draft]` -> `[Spoken Confirmation]` -> `[Biometric / PIN Unlock]` -> `[Decryption of Seed]` -> `[Ed25519 Local Signature]` -> `[Immediate Memory Zeroing of Seed]` -> `[Horizon Submission]`.

---

## 4. Proposed Phase 2 Key-Management Architecture

1. **Entropy & Mnemonic Generation:**
   - 128-bit cryptographically secure entropy generated via `crypto.getRandomValues()`.
   - Converted to 12-word BIP-39 English mnemonic.
2. **Key Derivation (SEP-0005 standard):**
   - PBKDF2 HMAC-SHA512 produces 512-bit seed.
   - SLIP-0010 derives Ed25519 keypair using standard Stellar derivation path:
     `m/44'/148'/0'` (primary account).
3. **Encrypted Persistence:**
   - The 12-word recovery mnemonic is encrypted and saved to `expo-secure-store` with `requireAuthentication: true`.
   - The public key (`G...`) is stored in ordinary local preferences and in `walletStore` for read-only balance lookups.
4. **Ephemerality of Signing Keys:**
   - Private key objects must be instantiated only inside isolated signing closures and immediately eligible for garbage collection upon signature calculation.
