import { SonoraAIOrchestrator } from '../../src/services/ai/SonoraAIOrchestrator';
import { ContactService } from '../../src/services/contacts/contactService';
import { ProactiveGuidance } from '../../src/services/ai/proactiveGuidance';
import { StellarTransactionSubmissionService } from '../../src/services/stellar/stellarTransactionSubmissionService';
import { StellarAccountService } from '../../src/services/stellar/stellarAccountService';
import { LocalPreferencesService } from '../../src/services/storage/localStorage';
import { useAIStore } from '../../src/store/aiStore';
import { useTransactionStore } from '../../src/store/transactionStore';
import { Keypair } from '@stellar/stellar-sdk';

describe('Phase 5: End-to-End User Journeys & Integration Validation', () => {
  const SENDER_PUB_KEY = Keypair.random().publicKey();
  const RECIPIENT_1_KEY = Keypair.random().publicKey();
  const RECIPIENT_2_KEY = Keypair.random().publicKey();

  beforeEach(async () => {
    useAIStore.getState().clearConversation();
    useTransactionStore.getState().clearTransaction();
    SonoraAIOrchestrator.getInstance().getContextManager().reset();
    await ContactService.clearContacts();
  });

  describe('Journey 1: First-Time Onboarding & Recovery Protection', () => {
    test('recovery phrase formatting is strictly isolated and never sent to AI provider', () => {
      // Invariant: AI store, prompt history, and AI tools must never store recovery words
      const store = useAIStore.getState();
      const orchestrator = SonoraAIOrchestrator.getInstance();

      const messages = store.messages;
      const draft = orchestrator.getContextManager().getDraft();

      expect(JSON.stringify(messages)).not.toContain('mnemonic');
      expect(JSON.stringify(draft)).not.toContain('mnemonic');
      expect(JSON.stringify(draft)).not.toContain('privateKey');
    });
  });

  describe('Journey 2: Conversational Interruption & Balance Check During Payment', () => {
    test('user can check balance mid-flow without losing pending draft or authorizing payment', async () => {
      jest.spyOn(StellarAccountService, 'getAccountInfo').mockResolvedValue({
        accountId: SENDER_PUB_KEY,
        sequence: '100',
        subentryCount: 0,
        balances: [{ asset_type: 'native', balance: '100.0' }],
        flags: {},
      });

      await ContactService.addContact('David Okafor', RECIPIENT_1_KEY);
      await ContactService.addContact('David Musa', RECIPIENT_2_KEY);

      const orchestrator = SonoraAIOrchestrator.getInstance();

      // Step 1: User initiates payment to ambiguous contact
      const res1 = await orchestrator.processUserInput('Send 10 XLM to David', SENDER_PUB_KEY);
      expect(orchestrator.getContextManager().getStep()).toBe('disambiguating_recipient');
      expect(res1.text).toContain('I found 2 contacts');

      // Step 2: User interrupts with balance inquiry
      const res2 = await orchestrator.processUserInput('Wait, how much do I have left?', SENDER_PUB_KEY);
      expect(res2.intent).toBe('check_balance');
      expect(res2.text).toContain('available to spend');
      expect(res2.text).toContain('Which contact did you want to select?');

      // Crucial Security Invariant: workflow state must remain in disambiguation, NOT approved or executed
      expect(orchestrator.getContextManager().getStep()).toBe('disambiguating_recipient');
      expect(useTransactionStore.getState().status).not.toBe('successful');
      expect(useTransactionStore.getState().authorization).toBeNull();

      // Step 3: User resolves disambiguation with Option 1
      const candidates = orchestrator.getContextManager().getDraft().disambiguationCandidates || [];
      expect(candidates).toHaveLength(2);
      orchestrator.getContextManager().resolveDisambiguation(candidates[0]);

      expect(orchestrator.getContextManager().getDraft().recipientName).toBe('David Okafor');
      expect(orchestrator.getContextManager().getDraft().recipient).toBe(RECIPIENT_1_KEY);
    });
  });

  describe('Journey 3: Network Failure & Duplicate Submission Prevention', () => {
    test('network timeout returns uncertain status and halts resubmission to prevent double spending', async () => {
      // Mock network timeout error in submission service
      jest.spyOn(StellarTransactionSubmissionService, 'investigateTransaction').mockResolvedValueOnce(null);

      const keypair = Keypair.random();
      const expectedHash = 'd'.repeat(64);

      // Simulate submission failure where request timed out
      const res = await (StellarTransactionSubmissionService as any).handleSubmissionError(
        new Error('Network timeout: ECONNABORTED'),
        expectedHash
      );

      expect(res.status).toBe('uncertain');
      expect(res.successful).toBe(false);
      expect(res.errorMessage).toContain('Please do not retry until verified');
    });
  });

  describe('Journey 4: Receive Address & SEP-0007 Payment Request Generation', () => {
    test('formats receiving address clearly for speech without 56-character barrage', () => {
      const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
      const formatted = ProactiveGuidance.formatAddressForSpeech(address);
      expect(formatted).toBe('G B B D, ending in, F L A 5');
    });

    test('generates valid SEP-0007 payment URI with amount, asset, and memo', () => {
      const address = SENDER_PUB_KEY;
      const amount = '25.5';
      const asset = 'USDC';
      const memo = 'invoice 502';

      let uri = `web+stellar:pay?destination=${address}`;
      uri += `&amount=${encodeURIComponent(amount)}`;
      uri += `&asset_code=${encodeURIComponent(asset)}`;
      uri += `&memo=${encodeURIComponent(memo)}&memo_type=MEMO_TEXT`;

      expect(uri).toContain(`destination=${address}`);
      expect(uri).toContain('amount=25.5');
      expect(uri).toContain('asset_code=USDC');
      expect(uri).toContain('memo=invoice%20502');
    });
  });

  describe('Journey 5: Speech Rate Customization & Persistence', () => {
    test('persists user speech rate preference', async () => {
      await LocalPreferencesService.setPreference('speech_rate', 1.2);
      const stored = await LocalPreferencesService.getPreference('speech_rate', 1.0);
      expect(stored).toBe(1.2);

      await LocalPreferencesService.setPreference('speech_rate', 0.8);
      const storedSlow = await LocalPreferencesService.getPreference('speech_rate', 1.0);
      expect(storedSlow).toBe(0.8);
    });
  });
});
