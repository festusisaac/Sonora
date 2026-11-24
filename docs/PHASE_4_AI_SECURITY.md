# SONORA — Phase 4: AI Security & Financial Authority Architecture

## 1. Non-Negotiable Financial Authority Principle

The AI companion is an **intelligent assistant**, NEVER an autonomous financial agent:
- The AI **assists, clarifies, and prepares drafts**.
- The AI **NEVER decides, authorizes, signs, or submits** financial transactions.
- All monetary operations require explicit user authorization, gated by device biometrics or device PIN.

---

## 2. Exhaustive Verification of the 17 AI Security Invariants

| # | Security Invariant | Architectural Enforcement | Test Status |
|---|--------------------|---------------------------|-------------|
| **1** | **AI cannot sign transactions** | Signing methods (`signPayment`, `signTransaction`) do NOT exist in the tool registry. Any attempt to invoke them is intercepted and rejected with `SECURITY_VIOLATION`. | Verified |
| **2** | **AI cannot access private keys** | `WalletKeyStorage` is isolated from the AI tool dispatcher. No tool returns private keys or seeds. | Verified |
| **3** | **AI cannot access recovery phrases** | Recovery phrases are never loaded or returned by any AI service or provider prompt. | Verified |
| **4** | **AI cannot bypass biometric/PIN authorization** | Biometric gates are enforced natively by `useTransactionSubmission` and `LocalAuthentication`. | Verified |
| **5** | **AI cannot submit transactions directly** | `ToolDispatcher` has no network submission endpoint. Submissions are strictly handled by `stellarTransactionSubmissionService` after biometric confirmation. | Verified |
| **6** | **AI cannot alter payment amounts after review** | Once a draft enters `awaiting_review`, modifying amounts requires a workflow reset and re-preparation. | Verified |
| **7** | **AI cannot alter recipients after review** | Recipients are immutable in `awaiting_review`. | Verified |
| **8** | **AI cannot autonomously select recipient under ambiguity** | When multiple contacts match (e.g. "David Okafor" and "David Musa"), the dispatcher returns `AMBIGUOUS_RECIPIENT`. The AI is blocked from guessing. | Verified |
| **9** | **Ambiguity resolution requires explicit user choice** | The user must speak an explicit candidate index or full name ("Option 1" or "David Okafor"). | Verified |
| **10** | **Payment review must speak exact details** | `ProactiveGuidance.formatReviewSummary` reads amount, asset, recipient, memo, and fee aloud. | Verified |
| **11** | **Silence or timeout cannot authorize payment** | Missing or empty input retains `awaiting_review` without authorizing. | Verified |
| **12** | **Ambiguous speech cannot authorize payment** | Unclear utterances ("Maybe later", "Sounds okay") do not trigger authorization. | Verified |
| **13** | **"Yes" to a clarification does not authorize payment** | "Yes" spoken during parameter collection or disambiguation never triggers transaction signing. | Verified |
| **14** | **Explicit authorization required per transaction** | Every single payment draft requires independent biometric/PIN authorization. | Verified |
| **15** | **Tool dispatcher rejects unauthorized tools** | Blocklist + allowlist filters reject all unauthorized or unknown tool invocations. | Verified |
| **16** | **Prompt injection attempts are neutered** | Fast-path intent resolution and allowlisted tools ensure prompt injections cannot escape safety boundaries. | Verified |
| **17** | **Offline mode preserves security invariants** | MockAIProvider and local intent resolution enforce identical invariants without an internet connection. | Verified |

---

## 3. Privacy & Non-Custodial Boundaries

- **Zero Key Exfiltration:** Mnemonic phrases and private keys never touch prompt templates, external LLMs, or application logs.
- **Client-Side Processing:** All intent parsing, contact queries, and draft constructions are performed locally on the device.
- **Non-Custodial:** The user maintains 100% exclusive control over their cryptographic keys.
