import type { LifecycleTimeline, TxSnapshot } from './types.js';

export function buildLifecycleTimeline(snapshots: TxSnapshot[]): LifecycleTimeline {
  const sorted = [...snapshots].sort((a, b) => a.ts - b.ts);
  const timeline: LifecycleTimeline = [];

  for (const snap of sorted) {
    const prev = timeline[timeline.length - 1];
    if (prev && prev.normalized === snap.normalized) {
      continue;
    }

    const raw = (snap.raw ?? {}) as Record<string, unknown>;
    timeline.push({
      ts: snap.ts,
      normalized: snap.normalized,
      details: {
        blockNumber: typeof raw.block_number === 'number' ? raw.block_number : undefined,
        txIndex: typeof raw.transaction_index === 'number' ? raw.transaction_index : undefined,
        finality: typeof raw.finality_status === 'string' ? raw.finality_status : undefined
      }
    });
  }

  return timeline;
}
