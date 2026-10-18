export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function passwordMatches(input: string, expected: string | undefined): boolean {
  return !!expected && safeEqual(input, expected);
}

/** Token is `<expiresAtMs>.<hmac>`; stateless, so no session store is needed. */
export async function signSession(secret: string, expiresAtMs: number): Promise<string> {
  return `${expiresAtMs}.${await hmac(secret, String(expiresAtMs))}`;
}

export async function verifySession(
  secret: string | undefined,
  token: string | undefined,
  nowMs: number,
): Promise<boolean> {
  if (!secret || !token) return false;
  const [expires, sig] = token.split('.');
  if (!expires || !sig || Number(expires) <= nowMs) return false;
  return safeEqual(sig, await hmac(secret, expires));
}
