import fs from 'node:fs';
import path from 'node:path';

/** Minimal .env.local loader for operator scripts (Next.js loads it itself for the app). Never prints values. */
export function loadLocalEnv(file = '.env.local'): void {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trimStart().startsWith('#')) continue;
    const [, key, raw] = m as unknown as [string, string, string];
    if (process.env[key] === undefined) process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2');
  }
  fs.mkdirSync(path.join(process.cwd(), '.data'), { recursive: true });
}
