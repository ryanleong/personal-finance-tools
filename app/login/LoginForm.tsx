'use client';

import { useActionState } from 'react';
import { login } from './actions';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        aria-label="Password"
        required
        autoFocus
        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>Sign in</Button>
    </form>
  );
}
