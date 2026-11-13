import type { Metadata } from 'next';
import { SignInPage } from '../_signin-page';

export const metadata: Metadata = { title: 'Sign up', robots: { index: false } };

/** /signup (A-01). */
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SignInPage mode="signup" searchParams={searchParams} />;
}
