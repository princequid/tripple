import { loadLocalEnv } from './_env';
loadLocalEnv();

const { runMigrations } = await import('../src/server/db/migrate');
const { getDb } = await import('../src/server/db/client');
const { ensureReferenceData } = await import('../src/server/db/reference-data');
await runMigrations();
// Reference data every environment needs (BR-36: the 8 categories). Without it no shot can be inserted.
await ensureReferenceData(await getDb());
console.log(`Migrations and reference data applied to ${process.env.DATABASE_URL?.startsWith('file:') ? process.env.DATABASE_URL : '(remote database)'}`);
process.exit(0);
