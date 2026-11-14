/**
 * Prints the latest sign-in code from the development outbox (EMAIL_TRANSPORT=outbox), for live demos.
 * Usage: npm run demo:code [email]   (default: demo@seed.trippple.test)
 */
import fs from 'node:fs';
import path from 'node:path';

const email = (process.argv[2] ?? 'demo@seed.trippple.test').toLowerCase();
const file = path.join(process.cwd(), '.data', 'outbox.jsonl');
const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n') : [];
const hit = lines
  .map((l) => { try { return JSON.parse(l) as { to: string; code?: string; at: number }; } catch { return null; } })
  .filter((m): m is { to: string; code: string; at: number } => !!m?.code && m.to.toLowerCase() === email)
  .pop();
if (!hit) {
  console.log(`No code for ${email} yet. Request one on /login first.`);
  process.exit(1);
}
const mins = Math.round((Date.now() - hit.at) / 60000);
console.log(`${hit.code}  (sent to ${email} ${mins} min ago)`);
