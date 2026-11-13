import type { Metadata } from 'next';
import { SignInPage } from '../_signin-page';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

/** /login (A-01). */
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SignInPage mode="login" searchParams={searchParams} />;
}
