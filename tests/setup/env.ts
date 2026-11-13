import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Runs before every test file (in its own process, pool "forks"). Each file gets its own libSQL file
 * database so files never share state. Secrets are test-only placeholders, never real values.
 */
const dir = path.join(process.cwd(), '.data', 'test');
fs.mkdirSync(dir, { recursive: true });

process.env.APP_ENV = 'test';
process.env.DATABASE_URL = `file:${path.join(dir, `${randomUUID()}.db`).replace(/\\/g, '/')}`;
process.env.DATABASE_AUTH_TOKEN = '';
process.env.BETTER_AUTH_SECRET = 'test-secret-test-secret-test-secret-0001';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.EMAIL_TRANSPORT = 'outbox';
process.env.NEXT_PUBLIC_MEDIA_BASE_URL = '/seed-media';
process.env.NEXT_PUBLIC_MEDIA_PROVIDER = 'local';
// R2 uploads (local provider): originals and rendered variants go to a per-file temporary folder.
const mediaRoot = path.join(dir, `media-${randomUUID()}`);
process.env.LOCAL_UPLOAD_DIR = path.join(mediaRoot, 'originals');
process.env.LOCAL_MEDIA_DIR = path.join(mediaRoot, 'public');
process.env.VIEW_HMAC_SECRET = 'test-view-secret-0001';
process.env.CURSOR_HMAC_SECRET = 'test-cursor-secret-0001';
process.env.CRON_SECRET = 'test-cron-secret-0001';
process.env.INTERNAL_SECRET = 'test-internal-secret-0001';
