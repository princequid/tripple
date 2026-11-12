import type { NextConfig } from 'next';
const config: NextConfig = { serverExternalPackages: ['@libsql/client', 'libsql'] };
export default config;
