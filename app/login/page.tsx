import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-6 py-24">
      <h1 className="mb-6 text-xl font-semibold">Sign in</h1>
      <LoginForm />
    </main>
  );
}
