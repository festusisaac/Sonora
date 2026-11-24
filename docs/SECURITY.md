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
