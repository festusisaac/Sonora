# SONORA — Phase 3: Stellar Protocol Integration Guide

## 1. Network Configuration

- **Network:** Stellar Testnet (`TESTNET`)
- **Network Passphrase:** `Test SDF Network ; September 2015`
- **Horizon Base URL:** `https://horizon-testnet.stellar.org`
- **Protocol Timebound:** Default 300 seconds (5 minutes validity)
- **Base Fee:** 100 stroops (0.00001 XLM)
- **Maximum Safe Fee Cap:** 100,000 stroops (0.01 XLM)

---

## 2. Operations Supported

### 2.1 Native Payment (`Operation.payment`)
Used when destination account already exists on the Stellar ledger:
- `destination`: 56-character Ed25519 public key starting with `G`
- `asset`: `Asset.native()`
- `amount`: Exact decimal string with up to 7 decimal places

### 2.2 Account Creation (`Operation.createAccount`)
Used when the destination account does NOT yet exist on the Stellar ledger:
- `destination`: 56-character Ed25519 public key starting with `G`
- `startingBalance`: Exact decimal string $\ge 1.0\text{ XLM}$ (Stellar base reserve minimum)

### 2.3 Issued Asset Payment (`Operation.payment`)
Used for tokens such as USDC:
- `destination`: Account with established, authorized trustline
- `asset`: `new Asset(code, issuer)`
- `amount`: Token decimal string

---

## 3. Memo Types & Constraints

Stellar transactions support one optional memo. SONORA validates all memo types according to protocol constraints:

| Memo Type | Encoding / Format | Constraints | SDK Factory |
| :--- | :--- | :--- | :--- |
| **None** | Empty | No memo attached | `Memo.none()` |
| **Text** | UTF-8 String | $\le 28$ bytes (multi-byte characters count accordingly) | `Memo.text(value)` |
| **ID** | Unsigned Integer String | $0 \le \text{ID} \le 18,446,744,073,709,551,615$ ($2^{64}-1$) | `Memo.id(value)` |
| **Hash** | 32-byte Hex String | Exactly 64 hexadecimal characters | `Memo.hash(value)` |
| **Return**| 32-byte Hex String | Exactly 64 hexadecimal characters | `Memo.return(value)` |

---

## 4. Ledger Verification Protocol

SONORA does NOT declare a payment successful upon local submission. The verification workflow:
1. Submits transaction envelope to Horizon `/transactions`.
2. Extracts transaction hash.
3. Polls `/transactions/{hash}` with backoff.
4. Reads `tx.successful`: must be boolean `true`.
5. Reads `tx.ledger_attr`: records exact ledger sequence.
6. Reads `tx.fee_charged`: records actual fee deducted on-chain.
7. Queries `/transactions/{hash}/operations` to verify operation counterparty and transferred asset.
