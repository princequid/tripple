import type { NextConfig } from 'next';

const config: NextConfig = {
  // libSQL ships native bindings; keep it out of the server bundle (ADR-005 partial evidence).
  serverExternalPackages: ['@libsql/client', 'libsql'],
  poweredByHeader: false,
  typedRoutes: false,
};

export default config;
