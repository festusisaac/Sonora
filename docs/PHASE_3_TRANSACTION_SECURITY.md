# SONORA — Phase 3: Transaction Security Model & Threat Assessment

## 1. Threat Model & Mitigations

| Threat | Attack Vector | SONORA Mitigation Strategy |
| :--- | :--- | :--- |
| **Recipient Substitution / Tampering** | Malware, malicious plugin, or memory mutation modifies destination after user confirms. | **Mathematical Authorization Binding:** Authorization is strictly tied to the SHA-256 hash of the exact transaction. Any change alters the hash and invalidates authorization. |
| **Silent Payment Signing** | Background service, voice assistant, or script initiates a signature without human knowledge. | **Biometric Gate & Strict Boundary:** Signing strictly requires explicit user confirmation followed by an interactive biometric / PIN prompt. |
| **Double Spending on Network Timeout** | Submission times out; app automatically retries or builds a duplicate payment, debiting the user twice. | **Timeout Safety Protocol:** Timeouts transition to `submission_uncertain`. The transaction hash is investigated on-chain before any new transaction is allowed. |
| **Acoustic Eavesdropping / Shoulder-Surfing** | Speech engine loudly announces confidential financial amounts or memo secrets. | **Controlled Audio Guidance:** Speech feedback requires deliberate button activation; private keys and seed material are never converted to speech. |
| **Stale Sequence Exploitation** | Submitting transactions with outdated account sequence numbers causes network rejection. | **Live Sequence Fetching:** Transaction preparation fetches fresh sequence numbers directly from Horizon immediately prior to builder instantiation. |
| **Mainnet Leakage** | A Testnet transaction is accidentally sent or signed against Stellar Mainnet. | **Environment Assertions:** `StellarNetworkConfig.assertTestnet()` hard-guards all services; throws fatal errors if Mainnet parameters are passed. |

---

## 2. Authorization Binding & Tamper Invalidation

The authorization model enforces that signing can only occur if:
$$\text{authorization.transactionHash} \equiv \text{preparedTransaction.transactionHash}$$

If ANY of the following fields are modified between review and signing:
1. Destination address
2. Payment amount
3. Asset code or asset issuer
4. Memo type or memo value
5. Estimated network fee
6. Source sequence number
7. Network passphrase

The cryptographic SHA-256 hash changes completely. The signer checks the hash before invoking the Keystore and throws an immediate error:
`"Transaction signing rejected: Missing or invalid user authorization for this transaction."`

---

## 3. Secret Isolation in Memory

- **No Secrets in Zustand:** Zustand manages only `PreparedPaymentTransaction` (public addresses, amount, fee, memo, unsigned XDR).
- **No Secrets in Logs:** Console logging and telemetry never receive Ed25519 seed strings or private key objects.
- **Ephemeral In-Memory Lifecycle:**
  ```typescript
  let secretKey: string | null = null;
  try {
    secretKey = await WalletKeyStorage.getSecretKey();
    const keypair = Keypair.fromSecret(secretKey);
    tx.sign(keypair);
  } finally {
    secretKey = null; // Memory reference wiped immediately
  }
  ```
