# SONORA

> **Your voice. Your money. Your control.**

SONORA is a voice-first, accessibility-first mobile Stellar wallet architected specifically for blind and visually impaired people.

---

## 1. Overview & Vision

Financial sovereignty requires accessibility. While modern cryptocurrency wallets present complex visual dashboards, graph charts, and intricate multi-step confirmations, visually impaired individuals face severe barriers when handling digital money.

SONORA is designed from the ground up to solve this:
- **Spoken Audio Feedback:** Every balance check, transaction detail, recipient confirmation, and error condition is announced through clear spoken voice synthesis.
- **Accessible Touch & TalkBack Design:** Every UI component complies with accessibility guidelines, enforcing minimum 48x48dp touch targets, semantic accessibility roles, live regions, and tactile haptic cues.
- **Voice-Directed Command Processing:** Natural spoken commands like *"Check my balance"* or *"Send 25 USDC to Musa"* are parsed and verified safely.
- **Stellar Network Integration:** Powered by the Stellar blockchain for fast, low-cost asset transfers, connected strictly to the **Stellar Testnet** using `@stellar/stellar-sdk` v17.
- **Non-Custodial & Safe:** Private keys never touch ordinary storage, Zustand stores, plaintext files, or external servers. Payments require explicit user confirmation before signing.

---

## 2. Technology Stack

- **Mobile Framework:** React Native 0.88 with Expo SDK 58
- **Navigation:** Expo Router (File-based navigation)
- **Language:** TypeScript (Strict Mode)
- **State Management:** Zustand
- **Async Caching & Queries:** TanStack Query (`@tanstack/react-query`)
- **Blockchain SDK:** `@stellar/stellar-sdk` v17.4.0 with Web Crypto `crypto.getRandomValues()` runtime polyfill
- **Voice & Accessibility:**
  - `expo-speech` (Text-To-Speech)
  - `expo-speech-recognition` + modular adapter (`ISpeechToTextAdapter`)
  - `expo-haptics` (Tactile vibration feedback)
  - React Native Accessibility APIs & Android TalkBack support
- **Protected Storage:** `expo-secure-store` (Android Keystore / iOS Keychain)
- **Quality & Testing:** Jest, `@testing-library/react-native` v14, ESLint, Prettier, TypeScript `tsc`

---

## 3. Project Structure

```text
sonora/
├── app/                           # Expo Router File-Based Routing
│   ├── _layout.tsx                # Polyfill imports, providers & global stack
│   ├── index.tsx                  # Accessible Home & TTS demo screen
│   ├── onboarding/index.tsx       # Voice onboarding tutorial
│   ├── wallet/index.tsx           # Balance overview & account status
│   ├── send/index.tsx             # Voice-guided send payment flow
│   ├── receive/index.tsx          # Public address & receiving info
│   ├── contacts/index.tsx         # Verified contact nicknames
│   └── settings/index.tsx         # Contrast, speech rate & preferences
│
├── src/
│   ├── components/
│   │   ├── common/                # AccessibleButton, AccessibleText, Card
│   │   └── accessibility/         # ScreenReaderAnnouncement, FocusWrapper
│   │
│   ├── services/
│   │   ├── stellar/               # Horizon client, account fetch, validation, tx
│   │   ├── speech/                # TTS service, STT adapter, command parser
│   │   ├── storage/               # SecureStore & local preferences
│   │   └── device/                # Haptics & clipboard
│   │
│   ├── store/                     # Zustand stores: wallet, voice, transaction
│   ├── hooks/                     # Custom React hooks (useVoiceAssistant, etc.)
│   ├── providers/                 # QueryProvider, ThemeProvider
│   ├── constants/                 # Stellar Testnet & accessibility constants
│   ├── config/                    # Polyfills (Web Crypto) & env config
│   ├── types/                     # TypeScript definitions
│   └── theme/                     # Accessible color tokens (WCAG AAA), typography
│
├── docs/
│   ├── ARCHITECTURE.md            # Comprehensive architectural specification
│   ├── SECURITY.md                # Security rules & key management guidelines
│   └── DEVELOPMENT_ROADMAP.md     # Multi-phase engineering roadmap
│
├── tests/
│   ├── unit/                      # Stellar validation, transactions, command parser, stores
│   └── components/                # AccessibleButton and UI tests
│
├── app.json                       # Expo configuration (com.sonora.wallet)
├── eas.json                       # EAS Build profile for Android
├── tsconfig.json                  # TypeScript configuration (strict mode)
└── package.json
```

---

## 4. Prerequisites & Environment Setup

This project is optimized for lightweight development on Windows, macOS, or Linux.

### Recommended Prerequisites:
- **Node.js:** v18, v20, or v22+ (tested with Node v24)
- **npm:** v10+
- **Git:** Installed and configured
- **Android Device or Emulator:** A physical Android phone connected via USB with USB Debugging enabled is recommended (especially on laptops with 8 GB RAM to preserve system resources).

---

## 5. Getting Started

### Installation
```bash
git clone <repository-url>
cd Sonora
npm install
```

### Start Development Server
```bash
npm start
# or
npx expo start
```

Press `a` in the terminal to launch on a connected Android phone or development build.

### Run Quality Checks
```bash
# TypeScript type check
npm run typecheck

# Jest Unit & Component Tests
npm test

# Linting
npm run lint

# Expo Diagnostic Check
npx expo-doctor
```

---

## 6. Important Architectural Decisions

### Stellar SDK v17 Upgrade
SONORA utilizes `@stellar/stellar-sdk` v17.4.0. In v17, the SDK adopts `@noble/ed25519`, `@noble/hashes`, and `@exodus/bytes`, using native `Uint8Array`. The legacy Node.js `Buffer` polyfill has been completely removed. Runtime random number generation in React Native Hermes is provided by `react-native-get-random-values`.

### Voice Recognition Integration
SONORA implements `ISpeechToTextAdapter` with two backends:
1. `NativeSpeechToTextAdapter`: Powered by `expo-speech-recognition` (Android SpeechRecognizer / iOS SFSpeechRecognizer). Activated in Expo development builds (`npx expo run:android`) and standalone APKs.
2. `DevSpeechToTextAdapter`: Simulated speech recognition allowing accessibility interaction testing in simulators and standard development environments.

### Zero Secrets in Memory State
Zustand stores strictly hold public information (public address, status, balances). Private keys are never placed in memory stores or ordinary local storage.

---

## 7. Current Limitations & Next Milestones

- **Phase 1 & 1.1 (Completed):** Complete infrastructure, type-safe architecture, Stellar SDK v17 upgrade, peer dependency resolution, native speech recognition adapter, accessible UI components, voice command parsing, and 100% passing test suite.
- **Phase 2:** Testnet key generation (BIP-39 mnemonic + Ed25519 derivation), encrypted Keystore persistence, and voice-assisted payment confirmation.
- **Phase 3:** Interactive payment flow with spoken verification, Horizon transaction submission, and contacts directory.

---

## 8. License

MIT
