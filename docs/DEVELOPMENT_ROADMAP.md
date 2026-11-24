# SONORA Development Roadmap

## Phase 1: Infrastructure & Foundation (Current Milestone)
- [x] Initial Expo + React Native + TypeScript project setup.
- [x] Strict TypeScript configuration.
- [x] Expo Router file-based navigation architecture.
- [x] Runtime polyfills for `@stellar/stellar-sdk` (Buffer, Web Crypto).
- [x] Stellar Testnet Horizon client, account retrieval, and StrKey validation.
- [x] Spoken audio feedback engine via `expo-speech`.
- [x] Speech command parsing engine.
- [x] Accessible UI component library (AccessibleButton, AccessibleText, LiveRegion).
- [x] Haptic tactile feedback service.
- [x] State management with Zustand and TanStack Query.
- [x] Test suite (Jest, React Native Testing Library).
- [x] EAS Build configuration for Android.

---

## Phase 2: Key Management & Onboarding
- [ ] Safe on-device key generation (BIP-39 mnemonic + Ed25519 derivation).
- [ ] Encrypted persistence in Android Keystore via SecureStore.
- [ ] Voice-assisted account backup walkthrough.
- [ ] Friendbot Testnet automatic funding interface for development accounts.
- [ ] Spoken account balance polling and real-time updates.

---

## Phase 3: Transaction Execution & Contacts
- [ ] Interactive payment flow with two-step voice confirmation:
  1. Audio breakdown: *"You are about to send 10 XLM to Musa. Fee is 0.00001 XLM. Confirm with Yes or Cancel."*
  2. Spoken confirmation + tactile confirm button.
- [ ] Testnet transaction signing via on-device Keypair.
- [ ] Horizon transaction submission and verification.
- [ ] Local encrypted contact book linking nicknames to Stellar addresses.

---

## Phase 4: Production Speech-to-Text & Hardening
- [ ] Integration of native speech recognition development build (`@react-native-voice/voice` or on-device model).
- [ ] Offline voice command fallback.
- [ ] Android TalkBack comprehensive audit.
- [ ] QR code scanning via `expo-camera` with accessible audio targeting cues.
- [ ] Production EAS Build release for Android.
