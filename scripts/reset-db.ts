import fs from 'node:fs';
import { loadLocalEnv } from './_env';
loadLocalEnv();

// Local development only: deletes the libSQL file database. Refuses anything that is not a local file.
const url = process.env.DATABASE_URL ?? 'file:.data/local.db';
if (!url.startsWith('file:')) {
  console.error('reset-db only works on a local file database. Refusing.');
  process.exit(1);
}
const file = url.slice('file:'.length);
for (const f of [file, `${file}-wal`, `${file}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
console.log(`Removed ${file}`);
