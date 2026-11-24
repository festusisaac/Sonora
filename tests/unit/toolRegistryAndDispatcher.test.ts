import { WALLET_TOOLS } from '../../src/services/ai/toolRegistry';
import { ToolDispatcher } from '../../src/services/ai/toolDispatcher';
import { ContactService } from '../../src/services/contacts/contactService';
import { StellarBalanceService } from '../../src/services/stellar/stellarBalanceService';
import { StellarAccountService } from '../../src/services/stellar/stellarAccountService';

jest.mock('../../src/services/stellar/stellarBalanceService');
jest.mock('../../src/services/stellar/stellarAccountService');

describe('Tool Registry & Tool Dispatcher', () => {
  const TEST_PUB_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  beforeEach(async () => {
    jest.clearAllMocks();
    await ContactService.clearContacts();
  });

  test('WALLET_TOOLS contains only allowlisted semantic tools', () => {
    const names = WALLET_TOOLS.map((t) => t.name);
    expect(names).toContain('getAccountDetails');
    expect(names).toContain('getBalances');
    expect(names).toContain('listContacts');
    expect(names).toContain('findContact');
    expect(names).toContain('addContact');
    expect(names).toContain('preparePayment');
    expect(names).toContain('getReceivingAddress');
    expect(names).toContain('getTransactionHistory');
    expect(names).toContain('updateSpeechSpeed');

    // Invariant: MUST NOT contain dangerous tools
    expect(names).not.toContain('signTransaction');
    expect(names).not.toContain('submitTransaction');
    expect(names).not.toContain('exportPrivateKey');
    expect(names).not.toContain('getRecoveryPhrase');
  });

  test('ToolDispatcher strictly REJECTS forbidden tools with SECURITY_VIOLATION', async () => {
    const forbiddenTools = [
      'signTransaction',
      'submitTransaction',
      'exportPrivateKey',
      'getRecoveryPhrase',
      'signPayment',
      'getPrivateKey',
      'exportSeed',
      'bypassAuthentication',
    ];

    for (const forbidden of forbiddenTools) {
      const res = await ToolDispatcher.executeToolCall(
        { id: `test-call-${forbidden}`, name: forbidden, parameters: {} },
        TEST_PUB_KEY
      );
      expect(res.error).toBeDefined();
      expect(res.error).toContain('SECURITY_VIOLATION');
      expect(res.result).toBeUndefined();
    }
  });

  test('ToolDispatcher strictly REJECTS unregistered/arbitrary tool calls', async () => {
    const res = await ToolDispatcher.executeToolCall(
      { id: 'random-1', name: 'deleteEverything', parameters: {} },
      TEST_PUB_KEY
    );
    expect(res.error).toBeDefined();
    expect(res.error).toContain('UNAUTHORIZED_TOOL');
  });

  test('ToolDispatcher executes getBalances safely', async () => {
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValueOnce({
      accountId: TEST_PUB_KEY,
      sequence: '100',
      subentryCount: 0,
      balances: [{ asset_type: 'native', balance: '100.5' }],
    });

    (StellarBalanceService.calculateAccountReserves as jest.Mock).mockReturnValueOnce({
      totalXlm: '100.5',
      availableXlm: '98.5',
      minimumReserve: '2.0',
    });

    const res = await ToolDispatcher.executeToolCall(
      { id: 'bal-1', name: 'getBalances', parameters: {} },
      TEST_PUB_KEY
    );

    expect(res.error).toBeUndefined();
    expect(res.result).toEqual({
      publicKey: TEST_PUB_KEY,
      nativeBalance: '100.5',
      availableNativeBalance: '98.5',
      assetBalances: [],
    });
  });

  test('ToolDispatcher executes contact operations (add, list, find)', async () => {
    // 1. Add contact
    const addRes = await ToolDispatcher.executeToolCall(
      {
        id: 'c-add',
        name: 'addContact',
        parameters: { name: 'Amina Bello', address: TEST_PUB_KEY },
      },
      TEST_PUB_KEY
    );
    expect(addRes.error).toBeUndefined();

    // 2. List contacts
    const listRes = await ToolDispatcher.executeToolCall(
      { id: 'c-list', name: 'listContacts', parameters: {} },
      TEST_PUB_KEY
    );
    const listData = listRes.result as { count: number; contacts: Array<{ name: string }> };
    expect(listData.count).toBe(1);
    expect(listData.contacts[0].name).toBe('Amina Bello');

    // 3. Find contact
    const findRes = await ToolDispatcher.executeToolCall(
      { id: 'c-find', name: 'findContact', parameters: { query: 'Amina' } },
      TEST_PUB_KEY
    );
    const findData = findRes.result as { count: number };
    expect(findData.count).toBe(1);
  });

  test('ToolDispatcher executes getReceivingAddress returning public key', async () => {
    const res = await ToolDispatcher.executeToolCall(
      { id: 'recv-1', name: 'getReceivingAddress', parameters: {} },
      TEST_PUB_KEY
    );
    expect(res.error).toBeUndefined();
    expect(res.result).toEqual({
      publicKey: TEST_PUB_KEY,
      displayAddress: TEST_PUB_KEY,
      qrPayload: `stellar:${TEST_PUB_KEY}`,
    });
  });

  test('ToolDispatcher adjusts speech speed within valid bounds', async () => {
    const res = await ToolDispatcher.executeToolCall(
      { id: 'spd-1', name: 'updateSpeechSpeed', parameters: { speed: 1.2 } },
      TEST_PUB_KEY
    );
    expect(res.error).toBeUndefined();
    expect(res.result).toEqual({ success: true, speechRate: 1.2 });

    // Invalid speed out of bounds
    const resBad = await ToolDispatcher.executeToolCall(
      { id: 'spd-bad', name: 'updateSpeechSpeed', parameters: { speed: 5.0 } },
      TEST_PUB_KEY
    );
    expect(resBad.error).toBeDefined();
    expect(resBad.error).toContain('Speech speed must be a number between 0.5 and 2.0');
  });
});
