import type { NormalizedStatus } from './types.js';

const MAP: Record<NormalizedStatus, { title: string; meaning: string; nextActions: string[] }> = {
  SUBMITTED: {
    title: 'Submitted',
    meaning: 'The transaction was submitted but has not yet progressed in sequencing.',
    nextActions: ['Wait a short period and refresh status.', 'Prepare fee bump if status does not progress.']
  },
  RECEIVED: {
    title: 'Received by Sequencer',
    meaning: 'The sequencer has acknowledged the transaction.',
    nextActions: ['Continue monitoring for pre-confirmation or acceptance.']
  },
  CANDIDATE: {
    title: 'Candidate',
    meaning: 'Transaction is a candidate for inclusion in a block.',
    nextActions: ['Keep monitoring; avoid duplicate submissions unless stuck for long.']
  },
  PRE_CONFIRMED: {
    title: 'Pre-confirmed',
    meaning: 'Transaction appears close to final acceptance but not final yet.',
    nextActions: ['Wait for final acceptance before considering complete.']
  },
  ACCEPTED_ON_L2: {
    title: 'Accepted on L2',
    meaning: 'Transaction reached finality on Starknet L2.',
    nextActions: ['No action required unless downstream process failed.']
  },
  ACCEPTED_ON_L1: {
    title: 'Accepted on L1',
    meaning: 'Transaction has reached L1-level acceptance/finality.',
    nextActions: ['No action required.']
  },
  REVERTED: {
    title: 'Reverted',
    meaning: 'Transaction executed but reverted.',
    nextActions: ['Inspect revert reason in receipt.', 'Fix call data or state assumptions, then resubmit.']
  },
  REJECTED: {
    title: 'Rejected',
    meaning: 'Transaction was rejected before successful execution.',
    nextActions: ['Check fee parameters and validity.', 'Re-submit with corrected params.']
  },
  NOT_FOUND: {
    title: 'Not Found',
    meaning: 'Transaction hash is not currently visible from RPC.',
    nextActions: ['Verify tx hash.', 'Wait briefly and retry on another RPC endpoint.']
  },
  UNKNOWN: {
    title: 'Unknown',
    meaning: 'The RPC response could not be mapped to a known status.',
    nextActions: ['Inspect raw JSON output.', 'Try fallback RPC and continue polling.']
  }
};

export function explainStatus(normalized: NormalizedStatus): { title: string; meaning: string; nextActions: string[] } {
  return MAP[normalized] ?? MAP.UNKNOWN;
}
