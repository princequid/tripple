import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect: 'turso', schema: './schema.ts', out: './migrations', dbCredentials: { url: 'file:spike01.db' } });
