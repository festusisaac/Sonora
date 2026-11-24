# SONORA — Phase 2: Security Model & Threat Assessment

## 1. Threat Model & Security Invariants

As an accessibility-first Stellar wallet, SONORA defends against both standard mobile attack vectors and unique threats faced by blind or visually impaired users.

### Security Invariants
1. **Never Log Secrets:** Mnemonic phrases, Ed25519 secret seeds, and intermediate cryptographic buffers are NEVER passed to `console.log`, analytics trackers, or crash reporters.
2. **Never Persist in Plaintext:** Unencrypted files, `AsyncStorage`, SQLite, and Zustand are strictly prohibited from storing private keys or mnemonics.
3. **Decoupled Biometrics:** Biometric sensors authorize local Keystore decryption; they do not perform cryptographic transaction signing.
4. **No Acoustic Eavesdropping:** Screen readers and speech synthesizers must not announce sensitive mnemonic words aloud without explicit user consent.

---

## 2. Storage Security: Android Keystore Architecture

On Android devices, `expo-secure-store` operates via the Android Keystore system:

1. **Master Key Generation:**
   - Generated inside the device's hardware-isolated Trusted Execution Environment (TEE) or StrongBox Keymaster.
   - The master key never leaves the secure hardware boundary.
2. **Data Encryption:**
   - Values are encrypted using AES-256 in GCM mode (Galois/Counter Mode), providing both confidentiality and cryptographic integrity verification.
3. **Storage Boundary:**
   - Ciphertext and GCM authentication tags are persisted inside app-private SharedPreferences (`sonora_sec_` prefix).
   - Only the SONORA application process with appropriate Linux UID permissions can access the preferences file.
4. **Payload Sizing:**
   - Individual secrets (24-word string ~ 160 bytes; Ed25519 S... secret key = 56 bytes) easily fit well within the Android Keystore 2048-byte limit.

---

## 3. Biometric Authentication vs. Cryptographic Signing

A common architectural misconception in mobile blockchain applications is confusing biometric prompts with digital signatures:

```
+--------------------------------------------------------------------------+
| 1. Biometric Authorization Phase (Device Level)                          |
| User Fingerprint / Face ID -> LocalAuthentication.authenticateAsync()     |
|   -> Validates user presence on the local hardware                       |
|   -> Unlocks Android Keystore AES-256 decryption key                     |
+--------------------------------------------------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------------+
| 2. Cryptographic Signing Phase (Blockchain Level)                        |
|   -> Keystore releases Ed25519 secret seed into ephemeral memory        |
|   -> @stellar/stellar-sdk Keypair.sign(transactionPayload)               |
|   -> Produces 64-byte Ed25519 digital signature                          |
|   -> Ephemeral memory buffer immediately unreferenced / zeroed           |
+--------------------------------------------------------------------------+
```

---

## 4. Accessibility Privacy Controls

Blind users frequently rely on Text-to-Speech (TTS) engines or TalkBack screen readers. If an application immediately announces a recovery phrase over the speaker, anyone nearby can record the phrase (acoustic eavesdropping / shoulder-surfing).

### SONORA Safeguards:
1. **No Auto-Speech of Seed Words:** The recovery screen displays words visually and permits TalkBack focus navigation, but does NOT speak the full phrase automatically upon mount.
2. **Spoken Audio Warning:** An accessible button announces an audio warning explaining that words are kept quiet to safeguard the user's funds against nearby listeners.
3. **High-Contrast Numbered Badges:** High contrast elements (Sky 400 on Slate 900, ratio > 7:1) ensure users with low vision or macular degeneration can read comfortably.
4. **Randomized Multi-Choice Challenge:** The backup verification uses a 3-question random multiple-choice interface rather than requiring manual text entry, reducing assistive keyboard friction.
