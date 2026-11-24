# SONORA — Phase 2: Key Derivation & SEP-0005 Specifications

## 1. Cryptographic Standards Overview

SONORA adheres strictly to standard Stellar ecosystem proposals and Bitcoin Improvement Proposals:

- **BIP-39:** Mnemonic code for generating deterministic keys.
- **BIP-44:** Multi-account hierarchy for deterministic wallets.
- **SLIP-0010:** Universal private key derivation from mnemonic seed for Ed25519.
- **SEP-0005:** Key derivation methods for Stellar accounts.

---

## 2. Derivation Pipeline

```
Entropy (256 bits via native crypto.getRandomValues)
  │
  ▼
BIP-39 24-Word Mnemonic Phrase (English wordlist)
  │
  ▼ (PBKDF2 HMAC-SHA512 with 2048 rounds + optional passphrase)
BIP-39 64-byte Binary Seed
  │
  ▼ (SLIP-0010 HMAC-SHA512 with key "ed25519 seed")
Master Secret Key + Master Chain Code
  │
  ▼ (Hardened child derivation: m/44'/148'/{accountIndex}')
32-byte Raw Ed25519 Seed
  │
  ▼ (@stellar/stellar-sdk Keypair.fromRawEd25519Seed)
Stellar Account:
  - Public Address: G... (Base32 encoded with StrKey version byte)
  - Secret Key:     S... (Base32 encoded with StrKey version byte)
```

---

## 3. Derivation Path Standard

In accordance with SEP-0005:

$$\text{Path} = m / 44' / 148' / a'$$

- `44'`: Purpose (BIP-44 specification, hardened)
- `148'`: Stellar Coin Type (Registered in SLIP-0044, hardened)
- `a'`: Account Index (Hardened, starting at $0'$ for primary account)

> [!IMPORTANT]
> All indices in the Stellar derivation path MUST be hardened. Ed25519 does not support non-hardened public child key derivation due to curve attributes.

---

## 4. Verification Against Official SEP-0005 Test Vectors

All test cases below are executed and asserted in `tests/unit/sep0005.test.ts`.

### Test Case 1 (12-word mnemonic)
- **Mnemonic:** `illness spike retreat truth genius clock brain pass fit cave bargain toe`
- **Seed Hex:** `e4a5a632e70943ae7f07659df1332160937fad82587216a4c64315a0fb39497ee4a01f76ddab4cba68147977f3a147b6ad584c41808e8238a07f6cc4b582f186`
- **Path `m/44'/148'/0'`:**
  - Public Key: `GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6`
  - Secret Key: `SBGWSG6BTNCKCOB3DIFBGCVMUPQFYPA2G4O34RMTB343OYPXU5DJDVMN`

### Test Case 3 (24-word mnemonic)
- **Mnemonic:** `bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better`
- **Seed Hex:** `937ae91f6ab6f12461d9936dfc1375ea5312d097f3f1eb6fed6a82fbe38c85824da8704389831482db0433e5f6c6c9700ff1946aa75ad8cc2654d6e40f567866`
- **Path `m/44'/148'/0'` (Primary Account):**
  - Public Key: `GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ`
  - Secret Key: `SAEWIVK3VLNEJ3WEJRZXQGDAS5NVG2BYSYDFRSH4GKVTS5RXNVED5AX7`
- **Path `m/44'/148'/1'` (Secondary Account):**
  - Public Key: `GB3MTYFXPBZBUINVG72XR7AQ6P2I32CYSXWNRKJ2PV5H5C7EAM5YYISO`
  - Secret Key: `SBKSABCPDWXDFSZISAVJ5XKVIEWV4M5O3KBRRLSPY3COQI7ZP423FYB4`

### Test Case 4 (24-word mnemonic with passphrase)
- **Mnemonic:** `cable spray genius state float twenty onion head street palace net private method loan turn phrase state blanket interest dry amazing dress blast tube`
- **Passphrase:** `p4ssphr4se`
- **Seed Hex:** `d425d39998fb42ce4cf31425f0eaec2f0a68f47655ea030d6d26e70200d8ff8bd4326b4bdf562ea8640a1501ae93ccd0fd7992116da5dfa24900e570a742a489`
- **Path `m/44'/148'/0'`:**
  - Public Key: `GDAHPZ2NSYIIHZXM56Y36SBVTV5QKFIZGYMMBHOU53ETUSWTP62B63EQ`
  - Secret Key: `SAFWTGXVS7ELMNCXELFWCFZOPMHUZ5LXNBGUVRCY3FHLFPXK4QPXYP2X`

### Test Case 5 (12-word zero entropy)
- **Mnemonic:** `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`
- **Seed Hex:** `5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4`
- **Path `m/44'/148'/0'`:**
  - Public Key: `GB3JDWCQJCWMJ3IILWIGDTQJJC5567PGVEVXSCVPEQOTDN64VJBDQBYX`
  - Secret Key: `SBUV3MRWKNS6AYKZ6E6MOUVF2OYMON3MIUASWL3JLY5E3ISDJFELYBRZ`
