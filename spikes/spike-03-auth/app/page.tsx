import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <pre id="session">{JSON.stringify(session ? { user: session.user.email, sessionId: session.session.id } : null)}</pre>;
}
