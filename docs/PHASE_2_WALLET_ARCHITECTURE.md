# SONORA — Phase 2: Secure Non-Custodial Wallet Architecture

## 1. Architectural Mission & Principles

SONORA is an accessibility-first, voice-first Stellar wallet designed for blind and visually impaired users.
Phase 2 establishes the non-custodial cryptographic foundation for creating, backing up, restoring, storing, and funding Stellar accounts on Testnet.

### Non-Custodial Core Rules
1. **Zero External Transmission:** Recovery phrases, private keys, and raw seed bytes are NEVER transmitted to any SONORA backend, telemetry server, analytics, or third party.
2. **Local Isolation:** Secrets reside strictly in hardware-backed secure storage (Android Keystore / iOS Keychain via `expo-secure-store`).
3. **Memory Ephemerality:** Secrets are retrieved on-demand only and never cached in persistent application stores (Zustand), SQLite, or unencrypted local storage.
4. **Accessible Privacy:** To prevent shoulder-surfing and voice eavesdropping, sensitive recovery words are never automatically read aloud by speech synthesizers without explicit user action.

---

## 2. Component Hierarchy

```
app/
 ├── wallet/
 │    ├── index.tsx              # Overview, public address, balances, Friendbot faucet, disconnect
 │    ├── create.tsx             # 24-word phrase generation, high-contrast badges, audio notice
 │    ├── backup-verify.tsx      # Multi-choice 3-word randomized confirmation challenge
 │    └── restore.tsx            # 24/12 word phrase entry with live validation
src/
 ├── services/
 │    ├── wallet/
 │    │    ├── mnemonicService.ts        # 256-bit entropy, BIP-39 wordlist, checksum validation
 │    │    ├── walletDerivationService.ts # SEP-0005 & SLIP-0010 Ed25519 derivation
 │    │    ├── walletCreationService.ts   # New wallet generation, backup challenges
 │    │    └── walletRestorationService.ts# Phrase restoration & account derivation
 │    ├── security/
 │    │    ├── walletKeyStorage.ts        # Hardware-backed Keystore abstraction
 │    │    └── deviceAuthenticationService.ts # Biometric & device passcode verification
 │    └── stellar/
 │         ├── stellarTestnetFundingService.ts # Friendbot faucet with rate limiting & testnet safety
 │         ├── client.ts                 # Horizon client singleton
 │         ├── account.ts                # Account balance loader
 │         └── validation.ts             # Public address and StrKey checks
 ├── hooks/
 │    ├── useWallet.ts                   # Unified wallet operations hook
 │    └── useWalletAuthentication.ts     # Biometric verification hook
 └── store/
      └── walletStore.ts                 # Zustand public metadata store (NO SECRETS)
```

---

## 3. Data Lifecycle & Separation of Concerns

| Data Element | Storage Location | Protection Mechanism |
| :--- | :--- | :--- |
| **BIP-39 Mnemonic** | Android Keystore | AES-256 GCM encrypted shared preferences |
| **Ed25519 Secret Key** | Android Keystore | Hardware TEE / StrongBox sealed |
| **Public Address (G...)**| Keystore + Zustand | Unencrypted public identifier |
| **Backup Verification Status** | Keystore + Zustand | Boolean flag |
| **Asset Balances** | Zustand Store | Ephemeral memory cache updated from Horizon |
| **Active Network** | App Config (`TESTNET`) | Hardcoded testnet guard |

---

## 4. Key Workflows

### 4.1 Wallet Creation Flow
1. User taps "Create New Wallet".
2. `MnemonicService.generate24WordMnemonic()` generates 256-bit entropy via `crypto.getRandomValues()` and builds a 24-word phrase from the BIP-39 English dictionary.
3. `WalletDerivationService.deriveKeypair(mnemonic, 0)` computes the primary account along path `m/44'/148'/0'`.
4. `WalletKeyStorage.saveWallet()` encrypts the mnemonic and secret key in Android Keystore, setting `isBackedUp: false`.
5. User writes down the 24 words displayed on screen with high-contrast numbered badges.
6. User proceeds to the Backup Verification challenge.

### 4.2 Accessible Backup Challenge Flow
1. `WalletCreationService.createBackupChallenge(mnemonic)` selects 3 distinct random word indices (e.g. #4, #12, #19).
2. For each index, 3 random distractor words from the BIP-39 dictionary are chosen alongside the correct word.
3. The options are shuffled and presented as accessible buttons with minimum $48\times 48\text{dp}$ touch targets.
4. User selects the correct word for each index and taps "Confirm Backup".
5. Upon 100% accuracy, `WalletKeyStorage.setBackupVerified(true)` commits the verified state to Keystore.

### 4.3 Wallet Restoration Flow
1. User enters 24 or 12 words in `app/wallet/restore.tsx`.
2. `MnemonicService.validate()` checks word count, dictionary inclusion, and BIP-39 checksum.
3. `WalletDerivationService.deriveKeypair()` derives account 0.
4. `WalletKeyStorage.saveWallet()` saves the keys with `isBackedUp: true`.
5. Background task loads balances from Stellar Horizon and navigates to `/wallet`.

### 4.4 Friendbot Testnet Funding Flow
1. User taps "Fund with Friendbot (+10,000 XLM)".
2. `StellarTestnetFundingService.fundAccount(publicKey)` verifies `ENV.stellarNetwork === 'TESTNET'`.
3. Calls `https://friendbot.stellar.org?addr={publicKey}`.
4. On success, waits 1.5 seconds for Horizon to ingest the ledger entry, then triggers `refreshBalances()`.
