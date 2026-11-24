# SONORA — Phase 3: Transaction Engine Architecture

## 1. Architectural Mission & Principles

SONORA is a non-custodial, voice-first Stellar wallet designed for blind and visually impaired users.
Phase 3 builds the complete, production-grade Stellar financial transaction engine.

### Core Architectural Principles
1. **Local-Only Signing:** Transaction envelopes are cryptographically signed on the device via the hardware-backed keystore layer established in Phase 2. Secrets never touch the network or external servers.
2. **Strict Authorization Boundary:** The engine strictly decouples transaction *preparation* from transaction *authorization*. Confirmation is cryptographically bound to the exact 64-character transaction hash. Any field alteration immediately invalidates authorization.
3. **Exact Decimal & Stroop Arithmetic:** Financial amounts are calculated exclusively using integer `bigint` stroops ($10^7$ stroops per XLM). Zero IEEE-754 floating-point arithmetic is permitted.
4. **Verifiable Ledger Truth:** An operation is never marked successful upon local submission. SONORA independently polls and verifies ledger inclusion, ledger sequence, and actual charged fees before announcing success.
5. **Double-Spend & Timeout Safety:** Submission timeouts are classified as `submission_uncertain` and investigated on-chain before any retry is allowed.

---

## 2. Service Architecture Map

```
src/services/stellar/
 ├── stellarNetworkConfig.ts             # Centralized, authoritative Testnet configuration & safeguards
 ├── stellarAccountService.ts           # Account info, sequence number, flags, raw balances
 ├── stellarBalanceService.ts           # Exact reserve formulas, available XLM & token calculation
 ├── stellarAssetService.ts             # Native vs issued asset validation & trustline checks
 ├── stellarRecipientService.ts         # Recipient address, ledger existence, creation requirements
 ├── stellarMemoService.ts              # Strict memo validation (Text <=28 bytes, ID, Hash, Return)
 ├── stellarFeeService.ts               # Horizon /fee-stats estimation & safety caps
 ├── stellarTransactionValidator.ts     # Pre-flight validation (balances, reserves, recipients, fees)
 ├── stellarTransactionBuilder.ts       # SDK TransactionBuilder, payment/createAccount, hash derivation
 ├── stellarTransactionAuthorizer.ts    # Mathematical authorization binding & tamper invalidation
 ├── stellarTransactionSigner.ts        # Biometric gating & local Keystore Ed25519 signing
 ├── stellarTransactionSubmissionService.ts # Horizon submission & timeout investigation
 ├── stellarTransactionVerificationService.ts # Independent ledger polling & verification
 └── stellarTransactionHistoryService.ts# Account payment operations & pagination

src/utils/
 └── stroop.ts                          # BigInt stroop arithmetic, precision enforcement (max 7 decimals)

src/types/
 ├── transaction.types.ts               # Comprehensive transaction models & lifecycle states
 └── stellar.types.ts                   # Account, reserve, recipient, and fee types

src/store/
 └── transactionStore.ts                # Non-sensitive Zustand store (prepared tx, status, history)

src/hooks/
 ├── useTransactionPreparation.ts       # Prepares transaction & manages pre-flight validation
 ├── useTransactionSubmission.ts        # Authorizes, signs, submits, and verifies on ledger
 ├── useTransactionHistory.ts           # Manages paginated payment history
 └── useStellarBalances.ts              # Manages reserves, total XLM, and spendable amounts
```

---

## 3. Transaction Lifecycle State Machine

SONORA transactions transition through explicit, unambiguous states:

```
[ draft ]
   │  User fills recipient, asset, amount, memo
   ▼
[ validating ]
   │  StellarTransactionValidator checks balances, reserves, trustlines
   ▼
[ awaiting_confirmation ]
   │  Transaction review presented; hash calculated
   ▼
[ awaiting_authentication ]
   │  User taps "Authorize & Sign Payment"; token bound to hash
   ▼
[ signing ]
   │  Device biometrics/PIN verified; Keystore signs locally
   ▼
[ signed ]
   │  Secret wiped from memory; envelope XDR ready
   ▼
[ submitting ]
   │  Submitted to Horizon Testnet
   ├── (Timeout / Network reset) ──► [ submission_uncertain ] ──► (Investigate)
   ▼
[ pending_verification ]
   │  Polling Horizon /transactions/{hash}
   ├── (Ledger rejected / failed op) ──► [ failed ]
   ▼
[ successful ]
   │  Confirmed on ledger; fee & sequence recorded; balances refreshed
```

---

## 4. Financial Precision & Reserve Calculations

Stellar represents balances with up to 7 decimal digits. One XLM equals 10,000,000 stroops ($10^7$).

### Reserve Calculation Formula:
$$\text{Base Reserve} = 5,000,000\text{ stroops } (0.5\text{ XLM})$$
$$\text{Minimum Account Reserve} = (2 + \text{subentries}) \times \text{Base Reserve}$$
$$\text{Locked Stroops} = \text{Minimum Reserve} + \text{Selling Liabilities}$$
$$\text{Available XLM} = \max(0, \text{Total XLM} - \text{Locked Stroops})$$
$$\text{Max Spendable XLM} = \max(0, \text{Available XLM} - \text{Estimated Fee})$$

For issued assets (e.g. USDC):
$$\text{Available Token} = \max(0, \text{Token Balance} - \text{Token Selling Liabilities})$$
Additionally, the source account MUST hold sufficient available XLM to cover the transaction fee.
