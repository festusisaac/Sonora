# SONORA — Phase 5: Voice-First Accessibility & TalkBack Validation

## 1. Voice-First Interaction Design

SONORA is designed so that a user who cannot see the screen can independently operate their Stellar wallet.

### A. Spoken Feedback Standards
1. **Address Formatting:** 56-character Stellar addresses are never read as 56 raw phonetic letters unless explicitly requested. Instead, SONORA reads:
   *"G B B D ... ending in ... F L A 5"*.
2. **Amount Formatting:** Fractional decimals are clearly vocalized:
   `5.5 XLM` is spoken as *"5 point 5 XLM"*.
3. **Fee Transparency:** Spoken fee details explain the network cost in both XLM and stroops (*"0.00001 XLM (100 stroops)"*).
4. **Speech Rate Customization:** The user can say *"Speak slower"* or *"Speak faster"*, or adjust between 0.8x, 1.0x, and 1.2x with instantaneous audio preview.

---

## 2. TalkBack Accessibility Review

All views were tested and audited for compatibility with Google TalkBack:

| Screen | Element | TalkBack Accessibility Label | Role | Touch Target |
|--------|---------|------------------------------|------|--------------|
| **Home** | Voice Button | "Tap to Speak" / "Listening... (Tap to finish)" | Button | 60dp |
| **Home** | Status Indicator | "Assistant ready" / "Listening" / "Thinking" / "Speaking" | LiveRegion | Polite/Assertive |
| **Home** | Quick Replies | "Check Balance", "Send XLM", "My Address" | Button | 48dp |
| **Home** | Review Card | "Review & Authorize" | Button | 52dp |
| **Contacts** | Contact Inputs | "Contact name input", "Stellar public key input" | EditText | 48dp |
| **Contacts** | Save / Delete | "Save Contact", "Deletes [Name] from contacts" | Button | 48dp |
| **Receive** | Share Button | "Opens native share sheet to share address" | Button | 48dp |
| **Settings** | Speed Toggles | "Sets speech playback rate to [rate] speed" | Button | 48dp |
| **Settings** | Clear Transcript | "Permanently clears your spoken chat history" | Button | 48dp |
| **Onboarding** | Welcome Audio | "Plays clear audio introduction to SONORA" | Button | 48dp |

---

## 3. Screen Reader Announcement Coexistence

To prevent TalkBack and Expo Speech (TTS) from competing or talking over each other:
1. `ScreenReaderAnnouncement` uses `accessibilityLiveRegion="polite"` for non-disruptive system updates.
2. Direct voice assistant responses use `TTSService.speak()`.
3. When the user taps the microphone button, `TTSService.stop()` immediately silences current audio, followed by a medium haptic tick (`HapticsService.impactMedium()`) signaling the microphone is active.
