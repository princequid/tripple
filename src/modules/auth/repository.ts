import 'server-only';
import { and, desc, eq, lt, ne, sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { session, verification, user } from '@/server/db/schema';

/**
 * Better Auth owns these tables. This repository removes rows (BR-25 revocation, BR-79 retention), lists a
 * user's sessions (FR-19), stores step-up codes in `verification` (account deletion, email change) and
 * changes the email after a verified code (FR-19).
 */
export async function deleteSessionsByUser(userId: string): Promise<number> {
  const db = await getDb();
  const res = await db.delete(session).where(eq(session.userId, userId));
  return res.rowsAffected;
}

export async function purgeExpired(now: number) {
  const db = await getDb();
  const day = 86_400_000;
  const [v, s] = await db.batch([
    // BR-79: OTP records within 24 h of expiry (used codes are deleted by Better Auth at verification).
    db.delete(verification).where(lt(verification.expiresAt, new Date(now - day))),
    // BR-79: session rows 7 days after expiry (revoked sessions are deleted immediately).
    db.delete(session).where(lt(session.expiresAt, new Date(now - 7 * day))),
  ]);
  return { verifications: v.rowsAffected, sessions: s.rowsAffected };
}

export async function listSessions(userId: string) {
  const db = await getDb();
  return db
    .select({ id: session.id, userAgent: session.userAgent, createdAt: session.createdAt, updatedAt: session.updatedAt, expiresAt: session.expiresAt })
    .from(session)
    .where(eq(session.userId, userId))
    .orderBy(desc(session.updatedAt));
}

export async function deleteSession(userId: string, id: string): Promise<number> {
  const db = await getDb();
  const res = await db.delete(session).where(and(eq(session.userId, userId), eq(session.id, id)));
  return res.rowsAffected;
}

export async function deleteOtherSessions(userId: string, keepId: string): Promise<number> {
  const db = await getDb();
  const res = await db.delete(session).where(and(eq(session.userId, userId), ne(session.id, keepId)));
  return res.rowsAffected;
}

/** Step-up code: one live code per identifier (a new one replaces the old, BR-03). Value = `${hash}:${attempts}`. */
export async function putCode(identifier: string, hash: string, expiresAt: number, now: number) {
  const db = await getDb();
  await db.batch([
    db.delete(verification).where(eq(verification.identifier, identifier)),
    db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier,
      value: `${hash}:0`,
      expiresAt: new Date(expiresAt),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }),
  ]);
}

export async function getCode(identifier: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: verification.id, value: verification.value, expiresAt: verification.expiresAt })
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1);
  return row ?? null;
}

export async function setCodeValue(id: string, value: string) {
  const db = await getDb();
  await db.update(verification).set({ value, updatedAt: new Date() }).where(eq(verification.id, id));
}

export async function deleteCode(identifier: string) {
  const db = await getDb();
  await db.delete(verification).where(eq(verification.identifier, identifier));
}

export async function findUser(userId: string) {
  const db = await getDb();
  const [row] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
  return row ?? null;
}

export async function emailInUse(email: string, exceptUserId: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select({ id: user.id }).from(user).where(and(eq(user.email, email), ne(user.id, exceptUserId))).limit(1);
  return rows.length > 0;
}

export async function setEmail(userId: string, email: string, now: number) {
  const db = await getDb();
  await db.update(user).set({ email, emailVerified: true, updatedAt: new Date(now) }).where(eq(user.id, userId));
}

/** BR-24 purge: removing the credential row cascades sessions and accounts. */
export async function deleteUser(userId: string) {
  const db = await getDb();
  await db.run(sql`DELETE FROM user WHERE id = ${userId}`);
}
