import { integer } from 'drizzle-orm/sqlite-core';

/** All timestamps are integer milliseconds UTC (BACKEND_ARCHITECTURE §5.3, ADR-003). */
export const ts = (name: string) => integer(name, { mode: 'timestamp_ms' });
export const bool = (name: string) => integer(name, { mode: 'boolean' });
