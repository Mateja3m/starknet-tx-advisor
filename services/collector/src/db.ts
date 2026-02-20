import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { NormalizedStatus, TxSnapshot } from '@starknet-tx-advisor/core';
import type { SnapshotKind } from './types.js';

export function createDb(dbPathFromEnv: string) {
  const absolutePath = path.resolve(process.cwd(), dbPathFromEnv);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const db = new Database(absolutePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tx_requests (
      tx_hash TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tx_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_hash TEXT NOT NULL,
      ts INTEGER NOT NULL,
      kind TEXT NOT NULL,
      normalized TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tx_snapshots_hash_ts ON tx_snapshots (tx_hash, ts);
  `);

  const upsertRequestStmt = db.prepare(`
    INSERT INTO tx_requests (tx_hash, created_at, last_seen_at)
    VALUES (@tx_hash, @created_at, @last_seen_at)
    ON CONFLICT(tx_hash) DO UPDATE SET last_seen_at = excluded.last_seen_at
  `);

  const insertSnapshotStmt = db.prepare(`
    INSERT INTO tx_snapshots (tx_hash, ts, kind, normalized, raw_json)
    VALUES (@tx_hash, @ts, @kind, @normalized, @raw_json)
  `);

  const listSnapshotsStmt = db.prepare(`
    SELECT ts, kind, normalized, raw_json
    FROM tx_snapshots
    WHERE tx_hash = ?
    ORDER BY ts ASC
  `);

  function upsertRequest(txHash: string) {
    const now = Date.now();
    upsertRequestStmt.run({ tx_hash: txHash, created_at: now, last_seen_at: now });
  }

  function touchRequest(txHash: string) {
    upsertRequestStmt.run({ tx_hash: txHash, created_at: Date.now(), last_seen_at: Date.now() });
  }

  function insertSnapshot(input: {
    txHash: string;
    ts: number;
    kind: SnapshotKind;
    normalized: NormalizedStatus;
    raw: unknown;
  }) {
    insertSnapshotStmt.run({
      tx_hash: input.txHash,
      ts: input.ts,
      kind: input.kind,
      normalized: input.normalized,
      raw_json: JSON.stringify(input.raw ?? {})
    });
  }

  function getSnapshots(txHash: string): TxSnapshot[] {
    const rows = listSnapshotsStmt.all(txHash) as Array<{ ts: number; kind: SnapshotKind; normalized: NormalizedStatus; raw_json: string }>;
    return rows.map((r) => ({
      ts: r.ts,
      source: r.kind === 'error' ? 'error' : r.kind,
      raw: JSON.parse(r.raw_json),
      normalized: r.normalized
    }));
  }

  return {
    upsertRequest,
    touchRequest,
    insertSnapshot,
    getSnapshots,
    absolutePath
  };
}
