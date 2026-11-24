# SONORA Architecture Specification

## 1. Architectural Philosophy

SONORA is built upon three foundational tenets:
1. **Accessibility by Default:** Visual elements are secondary to auditory, tactile, and screen-reader accessibility.
2. **Security & Self-Custody:** Private keys remain encrypted on-device. No automated or AI-authorized transactions are allowed.
3. **Decentralized Direct Connectivity:** The mobile client communicates directly with the Stellar Horizon network without intermediaries.

---

## 2. Layered Architecture

```text
┌────────────────────────────────────────────────────────┐
│                      app/ (Routes)                     │
│  index.tsx | wallet | send | receive | settings        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    src/components/                     │
│   AccessibleButton, AccessibleText, ScreenReaderLive   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              src/hooks/ & src/providers/               │
│   useVoiceAssistant, useStellarAccount, QueryProvider  │
└─────────────┬─────────────────────────────┬────────────┘
              │                             │
┌─────────────▼──────────────┐ ┌────────────▼────────────┐
│        src/store/          │ │      src/services/      │
│  walletStore, voiceStore   │ │  stellar, speech,       │
│  transactionStore (Zustand)│ │  storage, device        │
└────────────────────────────┘ └────────────┬────────────┘
                                            │
                               ┌────────────▼────────────┐
                               │  Stellar Testnet & OS   │
                               │  Horizon, SecureStore,  │
                               │  Expo Speech & Haptics  │
                               └─────────────────────────┘
```

---

## 3. Core Subsystems

### A. Stellar Service Subsystem (`src/services/stellar/`)
- **Client (`client.ts`):** Horizon Server connection pinned to Stellar Testnet (`https://horizon-testnet.stellar.org`).
- **Validation (`validation.ts`):** Validates Ed25519 public keys (`G...`) using `StrKey.isValidEd25519PublicKey`.
- **Account Data (`account.ts`):** Safely queries balances for native XLM and issued tokens (such as USDC).
- **Transactions (`transactions.ts`):** Prepares transaction specifications and verifies submitted hashes.

### B. Voice & Accessibility Subsystem (`src/services/speech/`)
- **TTS Engine (`tts.ts`):** Wrapper around `expo-speech` with configurable speech rate, pitch, and completion listeners.
- **Command Parser (`commandParser.ts`):** Intent resolution engine that extracts amounts, asset codes, and recipient nicknames from natural speech.
- **STT Adapter (`sttAdapter.ts`):** Decoupled adapter interface allowing seamless transition from development mocks to native speech recognition.
- **Haptic Tactile Feedback (`src/services/device/haptics.ts`):** Multi-tiered vibration responses providing tactile confirmation for actions.

### C. Storage & Credential Boundary (`src/services/storage/`)
- **`SecureStorageService`:** Uses `expo-secure-store` backed by Android Keystore.
- **`LocalPreferencesService`:** Non-sensitive store for high contrast toggle, speech rate, and recent searches.

---

## 4. State Management Strategy

- **TanStack Query:** Manages asynchronous network caching and auto-refresh for Stellar account data.
- **Zustand:** Synchronous UI state (listening state, active draft payment, theme preferences). Private keys are explicitly excluded from Zustand.
