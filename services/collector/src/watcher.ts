import { normalizeStatus, type NormalizedStatus } from '@starknet-tx-advisor/core';
import type { createDb } from './db.js';
import { StarknetRpcClient } from './rpc.js';

const FINAL_STATUSES: Set<NormalizedStatus> = new Set([
  'ACCEPTED_ON_L2',
  'ACCEPTED_ON_L1',
  'REVERTED',
  'REJECTED'
]);

const MAX_WATCH_AGE_MS = 30 * 60 * 1000;

export function createWatcherService(input: {
  db: ReturnType<typeof createDb>;
  rpc: StarknetRpcClient;
  pollIntervalMs: number;
}) {
  const { db, rpc, pollIntervalMs } = input;
  const active = new Map<string, { startedAt: number; timer: NodeJS.Timeout }>();

  async function pollOnce(txHash: string) {
    const now = Date.now();

    const txRes = await rpc.postJsonRpc<unknown>('starknet_getTransactionByHash', [txHash]);
    if (txRes.ok) {
      db.insertSnapshot({
        txHash,
        ts: now,
        kind: 'status',
        normalized: normalizeStatus(txRes.data),
        raw: { ...(txRes.data as object), __method: 'starknet_getTransactionByHash', __rpcUrl: txRes.rpcUrl }
      });
    }

    const statusRes = await rpc.postJsonRpc<unknown>('starknet_getTransactionStatus', [txHash]);
    if (statusRes.ok) {
      const normalized = normalizeStatus(statusRes.data);
      db.insertSnapshot({
        txHash,
        ts: now,
        kind: 'status',
        normalized,
        raw: { ...(statusRes.data as object), __rpcUrl: statusRes.rpcUrl }
      });

      if (FINAL_STATUSES.has(normalized)) {
        stop(txHash);
      }
    } else {
      const normalized = statusRes.error.code === 'TX_NOT_FOUND' ? 'NOT_FOUND' : 'UNKNOWN';
      db.insertSnapshot({
        txHash,
        ts: now,
        kind: 'error',
        normalized,
        raw: { error: statusRes.error }
      });
    }

    const receiptRes = await rpc.postJsonRpc<unknown>('starknet_getTransactionReceipt', [txHash]);
    if (receiptRes.ok) {
      const normalized = normalizeStatus(receiptRes.data);
      db.insertSnapshot({
        txHash,
        ts: Date.now(),
        kind: 'receipt',
        normalized,
        raw: { ...(receiptRes.data as object), __rpcUrl: receiptRes.rpcUrl }
      });

      if (FINAL_STATUSES.has(normalized)) {
        stop(txHash);
      }
    }

    db.touchRequest(txHash);

    const item = active.get(txHash);
    if (item && Date.now() - item.startedAt > MAX_WATCH_AGE_MS) {
      stop(txHash);
    }
  }

  function start(txHash: string) {
    if (active.has(txHash)) {
      return;
    }

    db.upsertRequest(txHash);
    void pollOnce(txHash);

    const timer = setInterval(() => {
      void pollOnce(txHash);
    }, pollIntervalMs);

    active.set(txHash, { startedAt: Date.now(), timer });
  }

  function stop(txHash: string) {
    const item = active.get(txHash);
    if (!item) return;
    clearInterval(item.timer);
    active.delete(txHash);
  }

  return {
    start,
    stop,
    isWatching: (txHash: string) => active.has(txHash)
  };
}
