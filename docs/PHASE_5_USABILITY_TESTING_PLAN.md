# SONORA — Phase 5: Real Blind-User Usability Testing Protocol

## 1. Protocol Purpose & Ethical Standards

Technical code audits cannot substitute for testing with actual blind and visually impaired people. This document establishes a formal usability testing protocol for evaluating SONORA with participants in a respectful, safe, and controlled environment.

---

## 2. Participant Safeguards & Ethical Governance

- **Informed Consent:** Participants receive an accessible audio or braille consent agreement explaining the study goals, data protection, and their right to withdraw at any time.
- **No Real Money:** All operations are conducted exclusively on Stellar Testnet using test funds funded via Friendbot.
- **Privacy Protection:** No participant voice recordings, personal identifiers, or cryptographic keys are shared with third parties or cloud providers.
- **Honorarium:** Participants are compensated for their time and expertise.

---

## 3. Structured Test Scenarios

### Scenario 1: First-Time Onboarding & Wallet Generation
- **Task:** Participant opens the app for the first time, listens to the spoken introduction, creates a wallet, and writes down or verifies their recovery phrase.
- **Success Criteria:** Independent completion without sighted intervention.
- **Metrics:** Time to complete, number of times audio is repeated, user confidence rating (1–5).

### Scenario 2: Spoken Balance & Account Status Inquiries
- **Task:** Participant asks the assistant: *"How much money do I have?"* and *"What is my wallet address?"*.
- **Success Criteria:** Correct comprehension of spoken balance and public address.
- **Metrics:** Recognition accuracy, speech intelligibility, comprehension score.

### Scenario 3: Contact Management & Disambiguation
- **Task:** Participant saves a contact ("Amina") with a provided Testnet address and then prepares a payment to a contact with an ambiguous name ("David").
- **Success Criteria:** Participant hears the disambiguation options and selects option 1 or 2 by voice.
- **Metrics:** Error recovery time, clarity of options.

### Scenario 4: Payment Preparation, Review, and Biometric Authorization
- **Task:** Participant speaks: *"Send 5 XLM to Amina"*, listens to the full payment review (amount, recipient, network fee), and confirms with device fingerprint or PIN.
- **Success Criteria:** Participant understands the financial commitment before signing, and verifies payment completion.
- **Metrics:** Anxiety/comfort level, review clarity score.

### Scenario 5: Conversational Interruption & Error Recovery
- **Task:** During payment preparation, participant asks: *"Wait, what is my balance?"*.
- **Success Criteria:** Assistant answers balance without cancelling the draft or executing the transaction.
- **Metrics:** Participant confusion score, task recovery rate.

---

## 4. Quantitative Usability Metrics

| Metric | Target Goal | Method of Measurement |
|---|---|---|
| **Task Completion Rate** | $\ge 90\%$ | Independent completion of core scenarios |
| **Speech Recognition Accuracy** | $\ge 92\%$ | Percentage of spoken phrases correctly transcribed |
| **Time to Send Payment** | $< 90\text{ seconds}$ | Clock time from first utterance to verification |
| **Assistance Interventions** | $\le 1\text{ per participant}$ | Times moderator is asked for clarification |
| **User Confidence Score** | $\ge 4.5 / 5.0$ | Post-session accessible Likert scale survey |
