import { describe, it, expect, vi, beforeEach } from 'vitest';

const gateway = { listTabs: vi.fn(), readTransactionRows: vi.fn() };
const createSheetsGateway = vi.fn();

vi.mock('@/lib/services/sheets', async (orig) => ({
  ...(await orig<typeof import('@/lib/services/sheets')>()),
  createSheetsGateway: (...a: unknown[]) => createSheetsGateway(...a),
}));
vi.mock('@/lib/rate-limiter', () => ({
  readRateLimiter: { isAllowed: vi.fn(() => true), getRetryAfter: vi.fn(() => 7) },
  getClientIP: vi.fn(() => '1.2.3.4'),
}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));

import { readTabAction } from './actions';
import { readRateLimiter } from '@/lib/rate-limiter';
import { SheetsError } from '@/lib/services/sheets';

const SECRET_ID = 'SECRET_SHEET_ID_123';
const rows = [['Date', 'Category'], [45000, 'Food', '', 'Card', -3.5, false]];

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.mocked(readRateLimiter.isAllowed).mockReturnValue(true);
  vi.stubEnv('GOOGLE_SHEET_ID', SECRET_ID);
  createSheetsGateway.mockReturnValue(gateway);
  gateway.listTabs.mockResolvedValue({ title: 'Budget', tabs: ['Jan', 'Feb'] });
  gateway.readTransactionRows.mockResolvedValue(rows);
});

describe('readTabAction', () => {
  it('returns the raw rows of an allowed tab', async () => {
    expect(await readTabAction('Jan')).toEqual({ success: true, rows });
    expect(gateway.readTransactionRows).toHaveBeenCalledWith('Jan');
  });

  it('rejects when rate limited', async () => {
    vi.mocked(readRateLimiter.isAllowed).mockReturnValue(false);
    const r = await readTabAction('Jan');
    expect(r.success).toBe(false);
    expect(r.error).toContain('7');
    expect(gateway.readTransactionRows).not.toHaveBeenCalled();
  });

  it('rejects a tab missing from the live list', async () => {
    const r = await readTabAction('Nope');
    expect(r.success).toBe(false);
    expect(gateway.readTransactionRows).not.toHaveBeenCalled();
  });

  it('rejects a real tab that is not whitelisted', async () => {
    vi.stubEnv('GOOGLE_SHEET_ALLOWED_TABS', 'Feb');
    const r = await readTabAction('Jan');
    expect(r.success).toBe(false);
    expect(gateway.readTransactionRows).not.toHaveBeenCalled();
  });

  it('uses the read wording on a gateway timeout', async () => {
    gateway.readTransactionRows.mockRejectedValue(new SheetsError('timeout'));
    expect(await readTabAction('Jan')).toEqual({ success: false, error: 'Timed out reading the sheet. Try again.' });
  });

  it('uses the read wording when the 30s guard fires', async () => {
    vi.useFakeTimers();
    try {
      gateway.readTransactionRows.mockReturnValue(new Promise(() => {}));
      const p = readTabAction('Jan');
      await vi.advanceTimersByTimeAsync(30001);
      expect(await p).toEqual({ success: false, error: 'Timed out reading the sheet. Try again.' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('maps errors to fixed messages without leaking raw text or the sheet id', async () => {
    gateway.readTransactionRows.mockRejectedValue(new Error(`boom ${SECRET_ID}`));
    const r = await readTabAction('Jan');
    expect(r).toEqual({ success: false, error: 'Google is unavailable. Try again.' });
    expect(JSON.stringify(r)).not.toContain(SECRET_ID);
    gateway.readTransactionRows.mockRejectedValue(new SheetsError('forbidden', `x ${SECRET_ID}`));
    expect(JSON.stringify(await readTabAction('Jan'))).not.toContain(SECRET_ID);
  });
});
