import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect: 'turso', schema: './lib/auth-schema.ts', out: './migrations', dbCredentials: { url: 'file:spike03.db' } });
