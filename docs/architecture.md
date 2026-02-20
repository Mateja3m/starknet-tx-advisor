# Architecture

## Components

- `app` (Next.js, TypeScript)
  - Single-page UI for tx hash analysis.
- `services/collector` (Express, TypeScript)
  - Starts watchers, polls Starknet RPC, stores snapshots, returns analysis.
- `packages/core` (pure TypeScript)
  - status normalization, timeline building, fee bump rule, status explanations.
- `packages/sdk` (optional helper)
  - tiny `logTxMeta` utility.
- `db/sqlite`
  - file-based SQLite storage.

## Data Flow

1. User submits `tx_hash` in web app.
2. Web calls `POST /watch`.
3. Collector starts poll loop for hash.
4. Collector queries RPC status + receipt (best effort).
5. Snapshots are persisted in SQLite.
6. Web calls `GET /tx/:hash`.
7. Collector reads snapshots and runs core analysis:
   - normalize statuses
   - build deduplicated timeline
   - generate deterministic fee bump recommendation
   - attach status explanation and diagnostics
8. Web renders panels and optional raw payload.

## RPC fallback

Collector tries RPC URLs in order:
1. `STARKNET_RPC_URL`
2. `STARKNET_RPC_URL_FALLBACK_1`
3. `STARKNET_RPC_URL_FALLBACK_2`

For each URL, it retries once for timeout/network/5xx before moving to next URL.
Successful URL is recorded in snapshot metadata as `__rpcUrl`.
