# SONORA — Phase 5: End-to-End Integration & System Validation

**Project:** SONORA  
**Tagline:** Your voice. Your money. Your control.  
**Platform:** Android (Expo SDK 58 / React Native 0.81.5)  
**Network:** Stellar Testnet  
**Target Users:** Blind and visually impaired individuals

---

## 1. System Integration Map

SONORA integrates 12 distinct systems into a single cohesive, voice-guided non-custodial wallet:

```
+-----------------------------------------------------------------------------------------+
|                                    USER INTERACTION                                     |
|  - Spoken Voice (Speech-to-Text Adapter)                                               |
|  - Spoken Audio Feedback (Expo Speech TTS)                                              |
|  - Android TalkBack Screen Reader (Accessibility Labels, Roles, Hints, Live Regions)    |
|  - High Contrast Accessible UI (WCAG AAA Palette: #F5F1E6, #171717, #F5C842)            |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                               SONORA AI ORCHESTRATOR                                    |
|  - Fast-Path Deterministic Intent Resolver (Nigerian English & Standard English)        |
|  - Multi-Turn Conversation Context Manager (Finite State Machine)                       |
|  - Proactive Guidance & Spoken Formatting                                               |
|  - Interruption Handling (Safe mid-workflow balance inquiries)                         |
|  - Provider Factory (MockAIProvider / OpenAI / Gemini)                                 |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                               WALLET TOOL DISPATCHER                                    |
|  - 18 Allowlisted Semantic Wallet Tools                                                |
|  - Forbidden Tool Filter (Enforces SECURITY_VIOLATION for signing/key retrieval)       |
|  - Verified Contact Directory (LocalPreferencesService)                                 |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                               STELLAR TRANSACTION ENGINE                                |
|  - Pre-flight Validation (Reserves, Trustlines, Account Existence, Amounts)             |
|  - Unsigned Transaction Builder (Timebounds, Base Fee, Deterministic Hash)              |
|  - Hardware Keystore & Biometric Gate (expo-local-authentication + SecureStore)         |
|  - Isolated Ed25519 Signer (Ephemeral secret handling, Zero memory retention)          |
|  - Safe Submission & Network Investigation (Duplicate spend prevention)                 |
|  - Live Ledger Verification (Horizon Testnet verification)                             |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Integrated User Journeys

### Journey A: First-Time Onboarding
- **Spoken Welcome:** Explains SONORA's voice-guided mission.
- **Voice Gestures:** Guides the user on how to use the large microphone button, say "Stop", "Cancel", and "Repeat".
- **Security Education:** Warns the user about their 24 recovery words and explains that recovery words are never sent to AI providers or cloud servers.
- **Wallet Creation & Verification:** Generates 24 words, copies to clipboard, and tests user memory with a 3-word verification challenge.

### Journey B: Returning User Experience
- Politeness on launch: Announces wallet readiness without reading sensitive balances aloud in public unprompted.
- Immediate command availability: User can double tap and say "Check my balance" or "Send 5 XLM to Amina".

### Journey C: Sending Payments with Conversational Interruption
- User initiates payment: *"Send 10 XLM to David"*.
- System detects multiple contacts: *"Found 2 contacts: 1. David Okafor, 2. David Musa. Say 1 or 2"*.
- User interrupts: *"Wait, how much do I have left?"*.
- Assistant answers: *"You currently have 98.5 XLM available to spend. Which contact did you want to select?"*.
- Draft remains intact; no premature signing or execution occurs.
- User selects *"Option 1"*; assistant constructs draft and speaks the review summary.
- User authorizes with device biometrics; transaction signs locally and submits to Stellar Testnet.

### Journey D: Receiving Payments & SEP-0007 Requests
- Spoken Address: Speaks public key intelligibly (*"G B B D ... ending in F L A 5"*).
- Native Sharing: Invokes Android `Share.share` menu.
- Payment Request Generator: Creates SEP-0007 standard URI with destination, amount, asset, and memo.
