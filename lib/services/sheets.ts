import { sheets, auth, type sheets_v4 } from '@googleapis/sheets';

export type SheetsErrorKind =
  | 'forbidden'
  | 'not-found'
  | 'rate-limited'
  | 'unavailable'
  | 'timeout'
  | 'not-configured';

export class SheetsError extends Error {
  constructor(
    public kind: SheetsErrorKind,
    message: string = kind
  ) {
    super(message);
    this.name = 'SheetsError';
  }
}

export interface SheetsGateway {
  /** `tabGids` maps tab title to its numeric sheetId, used for `#gid=` deep links. */
  listTabs(): Promise<{ title: string; tabs: string[]; tabGids: Record<string, number> }>;
  appendRows(tab: string, values: (string | number)[][]): Promise<void>;
  /** Columns A:H as displayed; Sheets omits trailing blank cells. */
  readRows(tab: string): Promise<string[][]>;
}

export type SheetsClient = sheets_v4.Sheets;
export interface SheetsCredentials {
  clientEmail: string;
  privateKey: string;
}

interface Options {
  env?: Record<string, string | undefined>;
  clientFactory?: (creds: SheetsCredentials) => SheetsClient;
}

const MAX_RETRIES = 2;
const BACKOFF_MS = 300;

const realClient = ({ clientEmail, privateKey }: SheetsCredentials): SheetsClient =>
  sheets({
    version: 'v4',
    auth: new auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    }),
  });

function readConfig(env: Record<string, string | undefined>) {
  const sheetId = env.GOOGLE_SHEET_ID;
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!sheetId || !raw) throw new SheetsError('not-configured');
  try {
    const { client_email, private_key } = JSON.parse(raw);
    if (typeof client_email !== 'string' || typeof private_key !== 'string') throw new Error();
    return {
      sheetId,
      creds: { clientEmail: client_email, privateKey: private_key.replace(/\\n/g, '\n') },
    };
  } catch {
    throw new SheetsError('not-configured', 'not-configured: invalid service account JSON');
  }
}

function statusOf(err: unknown): number {
  const e = err as { code?: number | string; response?: { status?: number } };
  return e.response?.status ?? (typeof e.code === 'number' ? e.code : 0);
}

function classify(err: unknown): SheetsError {
  const status = statusOf(err);
  const code = (err as { code?: string }).code;
  if (status === 403) return new SheetsError('forbidden');
  if (status === 400 || status === 404) return new SheetsError('not-found');
  if (status === 429) return new SheetsError('rate-limited');
  if (code === 'ETIMEDOUT' || code === 'ECONNABORTED') return new SheetsError('timeout');
  return new SheetsError('unavailable');
}

export function createSheetsGateway(opts: Options = {}): SheetsGateway {
  const { sheetId, creds } = readConfig(opts.env ?? process.env);
  const client = (opts.clientFactory ?? realClient)(creds);

  async function call<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (err) {
        console.error('Google Sheets error:', err); // raw detail stays server-side
        const status = statusOf(err);
        if ((status !== 429 && status < 500) || attempt >= MAX_RETRIES) throw classify(err);
        await new Promise((r) => setTimeout(r, BACKOFF_MS * 2 ** attempt));
      }
    }
  }

  return {
    async listTabs() {
      const res = await call(() =>
        client.spreadsheets.get({
          spreadsheetId: sheetId,
          fields: 'properties.title,sheets.properties(title,sheetId)',
        })
      );
      const props = (res.data.sheets ?? []).map((s) => s.properties).filter((p) => p?.title);
      return {
        title: res.data.properties?.title ?? '',
        tabs: props.map((p) => p!.title!),
        tabGids: Object.fromEntries(props.filter((p) => p!.sheetId != null).map((p) => [p!.title!, p!.sheetId!])),
      };
    },
    async readRows(tab) {
      const res = await call(() =>
        client.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `'${tab.replace(/'/g, "''")}'!A:H`,
          valueRenderOption: 'FORMATTED_VALUE',
        })
      );
      return (res.data.values ?? []) as string[][];
    },
    async appendRows(tab, values) {
      await call(() =>
        client.spreadsheets.values.append({
          spreadsheetId: sheetId,
          // The range only anchors where Sheets finds the table; widening it to H let other data in H/F/G shift the start column.
          range: `'${tab.replace(/'/g, "''")}'!A:E`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        })
      );
    },
  };
}

/** Keep only tabs named in `allowed` (comma-separated, exact names). Unset or blank allows all. */
export function filterAllowedTabs(tabs: string[], allowed: string | undefined): string[] {
  const names = (allowed ?? '').split(',').map((n) => n.trim()).filter(Boolean);
  return names.length ? tabs.filter((t) => names.includes(t)) : tabs;
}
