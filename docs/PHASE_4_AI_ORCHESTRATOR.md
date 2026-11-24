# SONORA — Phase 4: AI Orchestrator Architecture

**Project:** SONORA  
**Tagline:** Your voice. Your money. Your control.  
**Platform:** Android first (Accessible Stellar Wallet)  
**Target Users:** Blind and visually impaired individuals

---

## 1. Executive Summary

Phase 4 establishes **SonoraAIOrchestrator**, the central conversational intelligence layer bridging speech input, intent resolution, dialogue context management, allowlisted wallet tools, and spoken audio feedback.

Rather than being a conventional cryptocurrency wallet with an auxiliary chatbot, SONORA is designed from the ground up as an **AI-first, voice-operated Stellar companion**. Blind and visually impaired users can operate their wallet completely through natural spoken dialogue without needing to locate visual buttons or navigate complex forms.

---

## 2. Architectural Pillars

```
+-------------------------------------------------------------------------+
|                              USER (Spoken Audio)                        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|          STT Layer (Native SpeechRecognizer / Dev Fallback)             |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       SonoraAIOrchestrator                              |
|   +-----------------------------------------------------------------+   |
|   |                  Fast-Path Deterministic Intent                  |   |
|   |         (Balance, Receive, History, Cancel, Stop, Repeat)       |   |
|   +-----------------------------------------------------------------+   |
|                                    | (if general/conversational)        |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   |                   AI Provider (Mock / OpenAI / Gemini)          |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   |          Wallet Tool Registry & Dispatcher (Allowlisted)        |   |
|   |      (getBalances, listContacts, preparePayment, etc.)          |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   |                   Dialogue Context & State Machine               |   |
|   |    (idle -> collecting_details -> disambiguating -> review)     |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  Proactive Spoken Audio Feedback (TTS)                  |
|               (Clear numbers, truncated G-addresses, warnings)          |
+-------------------------------------------------------------------------+
```

---

## 3. Core Components

### 3.1 SonoraAIOrchestrator (`src/services/ai/SonoraAIOrchestrator.ts`)
- The central coordinator singleton.
- Processes text or speech input.
- Dispatches fast-path intents (stop, repeat, cancel, balance, contacts, speech rate).
- Manages multi-turn workflows (payment details collection, contact disambiguation, review).
- Interacts with active LLM provider via `ProviderFactory`.

### 3.2 Provider Architecture (`src/services/ai/providers/`)
- `AIProvider`: Common decoupled interface.
- `MockAIProvider`: Zero-dependency, offline, deterministic mock provider for testing and offline fallback.
- `OpenAIProvider`: Official Chat Completions API with Function Calling / Tool Calling support.
- `GeminiProvider`: Google Gemini API with Function Declarations support.
- `ProviderFactory`: Dynamically configures the active provider with graceful fallback to `MockAIProvider`.

### 3.3 Semantic Tool Registry (`src/services/ai/toolRegistry.ts`)
- 18 strictly typed, allowlisted semantic tools:
  - Account & Balances: `getAccountDetails`, `getBalances`, `getSupportedAssets`.
  - Contacts: `listContacts`, `findContact`, `addContact`.
  - Payments: `preparePayment`, `validatePaymentDraft`, `getReceivingAddress`, `createPaymentRequest`.
  - Activity: `getTransactionHistory`, `getTransactionDetails`, `getNetworkStatus`.
  - Settings: `getUserPreferences`, `updateUserPreference`, `updateSpeechSpeed`, `repeatLastResponse`, `getContextualHelp`, `getSecurityStatus`.

### 3.4 Intent Resolution & Entity Extraction (`src/services/ai/intentResolver.ts`)
- Low-latency local regex & linguistic entity extraction.
- Understands Nigerian English colloquial patterns ("abeg check my balance", "send five lumens give David", "oya stop", "abeg cancel", "how much dey inside my wallet").
- Extracts numeric and word-based amounts ("5", "ten point five", "twenty").
- Identifies Stellar G-addresses and contact nicknames.

### 3.5 Context Management (`src/services/ai/contextManager.ts`)
- Finite state machine tracking active workflows:
  - `idle`
  - `collecting_payment_details`
  - `disambiguating_recipient`
  - `awaiting_review`
  - `awaiting_authorization`
- Tracks missing required parameters (`recipient`, `amount`, `asset`).
- Handles user interruptions, cancellations, and repeats gracefully.

### 3.6 Proactive Guidance (`src/services/ai/proactiveGuidance.ts`)
- Formats 56-character Stellar addresses for audio comprehension ("G A B B ... ending in F L A 5").
- Formats amounts and network fees for natural speech.
- Formats disambiguation options when multiple contacts match.
