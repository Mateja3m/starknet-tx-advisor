import { describe, expect, it } from 'vitest';
import {
  normalizeStatus,
  calculateFeeBumpSuggestion,
  buildLifecycleTimeline,
  detectNonceConflict,
  type TxSnapshot
} from '../src/index.js';

describe('normalizeStatus', () => {
  it('maps accepted on l2', () => {
    expect(normalizeStatus({ finality_status: 'ACCEPTED_ON_L2' })).toBe('ACCEPTED_ON_L2');
  });

  it('maps not found signal', () => {
    expect(normalizeStatus({ error: 'TRANSACTION_HASH_NOT_FOUND' })).toBe('NOT_FOUND');
  });
});

describe('calculateFeeBumpSuggestion', () => {
  it('bumps and rounds up by 12%', () => {
    const out = calculateFeeBumpSuggestion({ currentTip: '100', currentMaxL2GasPrice: '101' });
    expect(out.shouldBump).toBe(true);
    expect(out.suggestedTip).toBe('112');
    expect(out.suggestedMaxL2GasPrice).toBe('114');
  });
});

describe('buildLifecycleTimeline', () => {
  it('sorts and dedupes by normalized status', () => {
    const snapshots: TxSnapshot[] = [
      { ts: 20, source: 'status', raw: {}, normalized: 'RECEIVED' },
      { ts: 10, source: 'status', raw: {}, normalized: 'SUBMITTED' },
      { ts: 30, source: 'status', raw: {}, normalized: 'RECEIVED' }
    ];
    const timeline = buildLifecycleTimeline(snapshots);
    expect(timeline.map((t) => t.normalized)).toEqual(['SUBMITTED', 'RECEIVED']);
  });
});

describe('detectNonceConflict', () => {
  it('detects pending nonce conflict', () => {
    const out = detectNonceConflict({ txNonce: '5', pendingNonces: ['4', '5'] });
    expect(out.conflict).toBe(true);
  });

  it('detects already used nonce', () => {
    const out = detectNonceConflict({ txNonce: '3', currentAccountNonce: '4' });
    expect(out.conflict).toBe(true);
  });
});
