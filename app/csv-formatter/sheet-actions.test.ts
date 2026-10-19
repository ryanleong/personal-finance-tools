import { describe, it, expect, vi, beforeEach } from 'vitest';

const gateway = { listTabs: vi.fn(), appendRows: vi.fn(), readRows: vi.fn() };
const createSheetsGateway = vi.fn();

vi.mock('@/lib/services/sheets', async (orig) => ({
  ...(await orig<typeof import('@/lib/services/sheets')>()),
  createSheetsGateway: (...a: unknown[]) => createSheetsGateway(...a),
}));
vi.mock('@/lib/rate-limiter', () => ({
  uploadRateLimiter: { isAllowed: vi.fn(), getRetryAfter: vi.fn() },
  processRateLimiter: { isAllowed: vi.fn(() => true), getRetryAfter: vi.fn(() => 42) },
  getClientIP: vi.fn(() => '1.2.3.4'),
}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));

import { getSheetTargetAction, appendToSheetAction, checkDuplicatesAction } from './actions';
import { fingerprintRows } from '@/lib/services/fingerprint';
import { processRateLimiter } from '@/lib/rate-limiter';
import { SheetsError, type SheetsErrorKind } from '@/lib/services/sheets';

const SECRET_ID = 'SECRET_SHEET_ID_123';
const rows = [{ date: '01/02/2024', description: 'Coffee', amount: -4.5 }];

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.mocked(processRateLimiter.isAllowed).mockReturnValue(true);
  vi.stubEnv('GOOGLE_SHEET_ID', SECRET_ID);
  createSheetsGateway.mockReturnValue(gateway);
  gateway.listTabs.mockResolvedValue({ title: 'Budget', tabs: ['Jan', 'Feb'] });
  gateway.appendRows.mockResolvedValue(undefined);
});

describe('getSheetTargetAction', () => {
  it('returns title, tabs and the sheet url', async () => {
    const r = await getSheetTargetAction();
    expect(r).toMatchObject({ success: true, title: 'Budget', tabs: ['Jan', 'Feb'] });
    expect(r.sheetUrl).toContain(SECRET_ID);
  });

  it('lists only whitelisted tabs when GOOGLE_SHEET_ALLOWED_TABS is set', async () => {
    vi.stubEnv('GOOGLE_SHEET_ALLOWED_TABS', 'Feb');
    expect((await getSheetTargetAction()).tabs).toEqual(['Feb']);
  });

  it('refuses to append to a real tab that is not whitelisted', async () => {
    vi.stubEnv('GOOGLE_SHEET_ALLOWED_TABS', 'Feb');
    const r = await appendToSheetAction('Jan', rows);
    expect(r.success).toBe(false);
    expect(gateway.appendRows).not.toHaveBeenCalled();
  });

  it('maps not-configured without leaking details', async () => {
    createSheetsGateway.mockImplementation(() => {
      throw new SheetsError('not-configured', 'not-configured: invalid service account JSON');
    });
    const r = await getSheetTargetAction();
    expect(r).toEqual({ success: false, error: "Google Sheets isn't configured on the server." });
  });
});

describe('appendToSheetAction', () => {
  it('rejects when rate limited', async () => {
    vi.mocked(processRateLimiter.isAllowed).mockReturnValue(false);
    const r = await appendToSheetAction('Jan', rows);
    expect(r.success).toBe(false);
    expect(r.error).toContain('42');
    expect(gateway.appendRows).not.toHaveBeenCalled();
  });

  it('rejects more than 10,000 rows', async () => {
    const r = await appendToSheetAction('Jan', new Array(10001).fill(rows[0]));
    expect(r.success).toBe(false);
    expect(r.error).toContain('10,000');
    expect(gateway.appendRows).not.toHaveBeenCalled();
  });

  it('rejects an unknown tab without appending', async () => {
    const r = await appendToSheetAction('Nope', rows);
    expect(r).toEqual({
      success: false,
      error: "That tab wasn't found. Reload the list and pick another.",
    });
    expect(gateway.appendRows).not.toHaveBeenCalled();
  });

  it('appends sheet rows and returns the count', async () => {
    const r = await appendToSheetAction('Jan', rows);
    expect(r).toEqual({ success: true, rowCount: 1 });
    expect(gateway.appendRows).toHaveBeenCalledWith('Jan', [
      ['01/02/2024', '', 'Coffee', '', '-4.50', '', '', expect.stringMatching(/^[0-9a-f]{16}$/)],
    ]);
  });

  it('skips excluded rows but keeps fingerprints numbered over the whole file', async () => {
    const two = [rows[0], rows[0]];
    const r = await appendToSheetAction('Jan', two, [0]);
    expect(r).toEqual({ success: true, rowCount: 1 });
    const [, second] = fingerprintRows(two.map(() => ['01/02/2024', '', 'Coffee', '', '-4.50']));
    expect(gateway.appendRows.mock.calls[0][1]).toEqual([
      ['01/02/2024', '', 'Coffee', '', '-4.50', '', '', second],
    ]);
  });

  it('refuses to append when every row is excluded', async () => {
    const r = await appendToSheetAction('Jan', rows, [0]);
    expect(r.success).toBe(false);
    expect(gateway.appendRows).not.toHaveBeenCalled();
  });

  it.each<[SheetsErrorKind, string]>([
    [
      'forbidden',
      "The service account can't access this spreadsheet. Check it is shared with the service account as Editor.",
    ],
    ['not-found', "That tab wasn't found. Reload the list and pick another."],
    ['rate-limited', 'Google rate limit hit. Wait a minute and try again.'],
    ['unavailable', 'Google is unavailable. Try again.'],
    [
      'timeout',
      'The request timed out. Check the sheet before retrying, the rows may already have been added.',
    ],
    ['not-configured', "Google Sheets isn't configured on the server."],
  ])('maps %s errors', async (kind, message) => {
    gateway.appendRows.mockRejectedValue(new SheetsError(kind));
    const r = await appendToSheetAction('Jan', rows);
    expect(r).toEqual({ success: false, error: message });
  });

  it('never leaks the sheet id on unexpected errors', async () => {
    gateway.appendRows.mockRejectedValue(new Error(`boom ${SECRET_ID}`));
    const r = await appendToSheetAction('Jan', rows);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).not.toContain(SECRET_ID);
  });
});

describe('checkDuplicatesAction', () => {
  const [fp] = fingerprintRows([['01/02/2024', '', 'Coffee', '', '-4.50']]);

  it('flags rows whose fingerprint is stored in the tab', async () => {
    gateway.readRows.mockResolvedValue([['01/02/2024', '', 'Coffee', '', '-4.50', '', '', fp]]);
    const other = { date: '02/02/2024', description: 'Lunch', amount: -9 };
    expect(await checkDuplicatesAction('Jan', [rows[0], other])).toEqual({ success: true, duplicates: [true, false] });
  });

  it('recognises legacy rows that have no stored fingerprint', async () => {
    gateway.readRows.mockResolvedValue([['01/02/2024', '', 'Coffee', '', '-4.5']]);
    expect((await checkDuplicatesAction('Jan', rows)).duplicates).toEqual([true]);
  });

  it('rejects an unknown tab without reading it', async () => {
    const r = await checkDuplicatesAction('Nope', rows);
    expect(r.success).toBe(false);
    expect(gateway.readRows).not.toHaveBeenCalled();
  });

  it('maps gateway errors', async () => {
    gateway.readRows.mockRejectedValue(new SheetsError('forbidden'));
    expect((await checkDuplicatesAction('Jan', rows)).error).toContain("can't access");
  });
});
