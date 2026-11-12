# Spikes (throwaway)

Technical spikes for phase P02 (SPIKE-01…05). **Never imported by the application, never promoted into `src/`, deleted or archived at gate G5 (P08-10).** Findings are in [`docs/02-architecture/ARCHITECTURE_DECISIONS.md`](../docs/02-architecture/ARCHITECTURE_DECISIONS.md).

| Folder | Spike | Status |
|---|---|---|
| `spike-01-fts/` | Turso full-text search (FTS5 vs `USING fts`) | Local done; Turso Cloud re-check pending |
| `spike-02-tx-fk/` | Foreign keys, batch/transaction atomicity | Local done; remote re-check: `TURSO_URL=… TURSO_TOKEN=… node run.mjs` |
| `spike-03-auth/` | Better Auth email OTP + Drizzle/libSQL in Next.js | Email OTP done; Google pending OAuth client |
| `spike-04-media/` | sharp derivatives (+ R2 presigned upload) | sharp done; R2 pending account |
| `spike-05-deploy/` | Deployment build on the host | Not started (host account) |

The `.env.local` in `spike-03-auth` holds a **local-only dummy secret**, not a real credential.
