import fs from 'node:fs';
import path from 'node:path';

/** Reads the newest sign-in code sent to `email` from the dev/test outbox (EMAIL_TRANSPORT=outbox). */
export async function latestCode(email: string, after = 0, timeoutMs = 10_000): Promise<string> {
  const file = path.join(process.cwd(), '.data', 'outbox.jsonl');
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (fs.existsSync(file)) {
      const hit = fs
        .readFileSync(file, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as { to: string; code: string; at: number })
        .filter((m) => m.to === email.toLowerCase() && m.at >= after)
        .pop();
      if (hit) return hit.code;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No code arrived for ${email}`);
}

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
