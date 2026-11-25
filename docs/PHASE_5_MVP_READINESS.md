# SONORA — Phase 5: MVP Release Readiness & Build Verification

## 1. Android MVP Configuration Summary

- **App Name:** SONORA
- **Package ID:** `com.sonora.wallet`
- **Version:** `1.0.0` (Build 1)
- **Target OS:** Android 14+ (minSdk 24, targetSdk 36, compileSdk 37)
- **Target Device Tested:** Samsung Galaxy S21 (`SM-G991U`), Android 14
- **Runtime:** Hermes Engine (Bytecode compiled)
- **Stellar Network:** Stellar Testnet (`Test SDF Network ; September 2015`)
- **Horizon URL:** `https://horizon-testnet.stellar.org`

---

## 2. Android Permissions Audit

| Permission | Justification | Enforced Status |
|---|---|---|
| `android.permission.RECORD_AUDIO` | Required for speech-to-text recognition | Granted on-demand |
| `android.permission.VIBRATE` | Required for tactile haptic confirmation | Granted automatically |
| `android.permission.CAMERA` | QR code scanning for receiving addresses | Optional runtime request |
| `android.permission.USE_BIOMETRIC` | Biometric gate for Android Keystore signing | Enforced by Keystore |

---

## 3. Build & Packaging Instructions

### Local Development Build (EAS / Gradle)
```bash
# 1. Verify code health
npm run typecheck
npm run lint
npm test

# 2. Compile Android Hermes bytecode bundle
npx expo export --platform android

# 3. Build standalone debug APK via EAS or local Gradle
npx eas-cli build --profile development --platform android
# Or local build:
npx expo run:android --variant release
```

---

## 4. Known Limitations for Testnet MVP

1. **Testnet Only:** Real money / mainnet operations are strictly disabled. The app rejects any connection to the Public Global Stellar Network.
2. **Speech Recognition in High Noise:** Background ambient noise (e.g. busy traffic) can lower STT accuracy; an accessible on-screen text input is provided as a fallback.
3. **Hardware Biometric Dependency:** On devices lacking biometric hardware (fingerprint/face), the system automatically falls back to the device PIN or passcode via `LocalAuthentication`.
