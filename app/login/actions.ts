'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  passwordMatches,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
} from '@/lib/auth';

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  const password = String(formData.get('password') ?? '');

  if (!secret || !passwordMatches(password, process.env.AUTH_PASSWORD)) {
    // shortcut: fixed delay instead of real rate limiting, upgrade if the password is ever weak/shared.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return 'Incorrect password';
  }

  const token = await signSession(secret, Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
  redirect('/');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
