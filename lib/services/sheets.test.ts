import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSheetsGateway, filterAllowedTabs, SheetsError, type SheetsClient } from './sheets';

const env = {
  GOOGLE_SHEET_ID: 'sheet123',
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
    client_email: 'bot@x.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
  }),
};

function stub() {
  const get = vi.fn();
  const append = vi.fn();
  const valuesGet = vi.fn();
  const client = { spreadsheets: { get, values: { append, get: valuesGet } } } as unknown as SheetsClient;
  return { get, append, valuesGet, gateway: createSheetsGateway({ env, clientFactory: () => client }) };
}

const httpError = (status: number) => Object.assign(new Error('boom'), { code: status });

async function kindOf(p: Promise<unknown>) {
  const result = p.then(
    () => 'resolved',
    (e) => (e instanceof SheetsError ? e.kind : 'other')
  );
  await vi.runAllTimersAsync();
  return result;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('appendRows', () => {
  it('sends exact options and quoted range, escaping apostrophes', async () => {
    const { append, gateway } = stub();
    append.mockResolvedValue({});
    await gateway.appendRows("Bob's Tab", [['a', '', 'b', '', 1]]);
    expect(append).toHaveBeenCalledWith({
      spreadsheetId: 'sheet123',
      range: "'Bob''s Tab'!A:E",
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [['a', '', 'b', '', 1]] },
    });
  });

  it.each([
    [403, 'forbidden'],
    [400, 'not-found'],
    [404, 'not-found'],
  ])('maps %i to %s without retrying', async (status, kind) => {
    const { append, gateway } = stub();
    append.mockRejectedValue(httpError(status));
    expect(await kindOf(gateway.appendRows('T', []))).toBe(kind);
    expect(append).toHaveBeenCalledTimes(1);
  });

  it('retries 429 twice then rate-limited', async () => {
    const { append, gateway } = stub();
    append.mockRejectedValue(httpError(429));
    expect(await kindOf(gateway.appendRows('T', []))).toBe('rate-limited');
    expect(append).toHaveBeenCalledTimes(3);
  });

  it('retries 5xx then unavailable', async () => {
    const { append, gateway } = stub();
    append.mockRejectedValue(httpError(503));
    expect(await kindOf(gateway.appendRows('T', []))).toBe('unavailable');
    expect(append).toHaveBeenCalledTimes(3);
  });

  it('succeeds if a retry works', async () => {
    const { append, gateway } = stub();
    append.mockRejectedValueOnce(httpError(500)).mockResolvedValue({});
    expect(await kindOf(gateway.appendRows('T', []))).toBe('resolved');
    expect(append).toHaveBeenCalledTimes(2);
  });

  it('maps timeouts to timeout without retry', async () => {
    const { append, gateway } = stub();
    append.mockRejectedValue(Object.assign(new Error('t'), { code: 'ETIMEDOUT' }));
    expect(await kindOf(gateway.appendRows('T', []))).toBe('timeout');
    expect(append).toHaveBeenCalledTimes(1);
  });

  it('maps other network failures to unavailable without retry', async () => {
    const { append, gateway } = stub();
    append.mockRejectedValue(Object.assign(new Error('x'), { code: 'ECONNRESET' }));
    expect(await kindOf(gateway.appendRows('T', []))).toBe('unavailable');
    expect(append).toHaveBeenCalledTimes(1);
  });

  it('logs the raw error server-side but keeps it out of the thrown message', async () => {
    const { append, gateway } = stub();
    append.mockRejectedValue(Object.assign(new Error('secret raw detail'), { code: 403 }));
    const p = gateway.appendRows('T', []).catch((e) => e);
    await vi.runAllTimersAsync();
    expect((await p).message).not.toContain('secret');
    expect(console.error).toHaveBeenCalled();
  });
});

describe('readRows', () => {
  it('reads A:H as displayed and defaults to no rows', async () => {
    const { valuesGet, gateway } = stub();
    valuesGet.mockResolvedValueOnce({ data: { values: [['a']] } }).mockResolvedValueOnce({ data: {} });
    expect(await gateway.readRows("Bob's")).toEqual([['a']]);
    expect(valuesGet).toHaveBeenCalledWith({
      spreadsheetId: 'sheet123',
      range: "'Bob''s'!A:H",
      valueRenderOption: 'FORMATTED_VALUE',
    });
    expect(await gateway.readRows('T')).toEqual([]);
  });
});

describe('readTransactionRows', () => {
  it('reads A:F unformatted and defaults to no rows', async () => {
    const { valuesGet, gateway } = stub();
    valuesGet
      .mockResolvedValueOnce({ data: { values: [[45000, 'Food', '', 'Card', -3.5, true]] } })
      .mockResolvedValueOnce({ data: {} });
    expect(await gateway.readTransactionRows("Bob's")).toEqual([[45000, 'Food', '', 'Card', -3.5, true]]);
    expect(valuesGet).toHaveBeenCalledWith({
      spreadsheetId: 'sheet123',
      range: "'Bob''s'!A:F",
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    expect(await gateway.readTransactionRows('T')).toEqual([]);
  });

  it('maps 403 to forbidden', async () => {
    const { valuesGet, gateway } = stub();
    valuesGet.mockRejectedValue(httpError(403));
    expect(await kindOf(gateway.readTransactionRows('T'))).toBe('forbidden');
  });
});

describe('listTabs', () => {
  it('requests minimal fields and returns title and tab names', async () => {
    const { get, gateway } = stub();
    get.mockResolvedValue({
      data: {
        properties: { title: 'Budget' },
        sheets: [{ properties: { title: 'A', sheetId: 0 } }, { properties: { title: 'B', sheetId: 987 } }],
      },
    });
    expect(await gateway.listTabs()).toEqual({
      title: 'Budget',
      tabs: ['A', 'B'],
      tabGids: { A: 0, B: 987 },
    });
    expect(get).toHaveBeenCalledWith({
      spreadsheetId: 'sheet123',
      fields: 'properties.title,sheets.properties(title,sheetId)',
    });
  });

  it('classifies errors', async () => {
    const { get, gateway } = stub();
    get.mockRejectedValue(httpError(403));
    expect(await kindOf(gateway.listTabs())).toBe('forbidden');
  });
});

describe('config', () => {
  it('fixes escaped newlines in private_key', () => {
    const factory = vi.fn(() => ({}) as SheetsClient);
    createSheetsGateway({ env, clientFactory: factory });
    expect(factory).toHaveBeenCalledWith(
      expect.objectContaining({
        privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      })
    );
  });

  it.each([
    ['missing sheet id', { ...env, GOOGLE_SHEET_ID: undefined }],
    ['missing json', { ...env, GOOGLE_SERVICE_ACCOUNT_JSON: undefined }],
    ['invalid json', { ...env, GOOGLE_SERVICE_ACCOUNT_JSON: '{nope' }],
    ['json without key', { ...env, GOOGLE_SERVICE_ACCOUNT_JSON: '{"client_email":"a"}' }],
  ])('throws not-configured for %s', (_name, badEnv) => {
    let kind: string | undefined;
    try {
      createSheetsGateway({ env: badEnv, clientFactory: () => ({}) as SheetsClient });
    } catch (e) {
      kind = (e as SheetsError).kind;
    }
    expect(kind).toBe('not-configured');
  });
});

describe('filterAllowedTabs', () => {
  const tabs = ['Jan', 'Feb', 'Joint Account'];
  it('allows all tabs when unset or blank', () => {
    expect(filterAllowedTabs(tabs, undefined)).toEqual(tabs);
    expect(filterAllowedTabs(tabs, ' , ')).toEqual(tabs);
  });
  it('keeps only exact, trimmed names and ignores unknown ones', () => {
    expect(filterAllowedTabs(tabs, ' Feb, Joint Account ,Nope')).toEqual(['Feb', 'Joint Account']);
  });
});
