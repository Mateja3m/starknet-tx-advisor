import type { NormalizedStatus } from './types.js';

function asString(value: unknown): string {
  return String(value ?? '').toUpperCase();
}

function hasNotFoundSignal(raw: unknown): boolean {
  const payload = JSON.stringify(raw ?? {}).toLowerCase();
  return payload.includes('not found') || payload.includes('transaction_hash_not_found');
}

export function normalizeStatus(raw: unknown): NormalizedStatus {
  if (!raw) {
    return 'UNKNOWN';
  }

  if (hasNotFoundSignal(raw)) {
    return 'NOT_FOUND';
  }

  const obj = raw as Record<string, unknown>;
  const direct = asString(obj.status ?? obj.finality_status ?? obj.execution_status ?? obj.tx_status);

  if (direct.includes('ACCEPTED_ON_L1')) return 'ACCEPTED_ON_L1';
  if (direct.includes('ACCEPTED_ON_L2')) return 'ACCEPTED_ON_L2';
  if (direct.includes('PRE_CONFIRMED')) return 'PRE_CONFIRMED';
  if (direct.includes('CANDIDATE')) return 'CANDIDATE';
  if (direct.includes('RECEIVED')) return 'RECEIVED';
  if (direct.includes('REJECTED')) return 'REJECTED';
  if (direct.includes('REVERT')) return 'REVERTED';
  if (direct.includes('SUBMITTED')) return 'SUBMITTED';

  const receiptFinality = asString(obj.finality_status);
  const receiptExecution = asString(obj.execution_status);

  if (receiptFinality.includes('ACCEPTED_ON_L1')) return 'ACCEPTED_ON_L1';
  if (receiptFinality.includes('ACCEPTED_ON_L2')) return 'ACCEPTED_ON_L2';
  if (receiptExecution.includes('REJECTED')) return 'REJECTED';
  if (receiptExecution.includes('REVERT')) return 'REVERTED';

  return 'UNKNOWN';
}
