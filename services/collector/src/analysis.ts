import {
  buildLifecycleTimeline,
  calculateFeeBumpSuggestion,
  detectNonceConflict,
  explainStatus,
  type TxAnalysisResult,
  type TxSnapshot,
  type NormalizedStatus
} from '@starknet-tx-advisor/core';

export function buildAnalysis(txHash: string, snapshots: TxSnapshot[]): TxAnalysisResult {
  const timeline = buildLifecycleTimeline(snapshots);
  const currentStatus: NormalizedStatus = timeline.length ? timeline[timeline.length - 1].normalized : 'UNKNOWN';

  const latestRaw = snapshots.length ? (snapshots[snapshots.length - 1].raw as Record<string, unknown>) : {};

  const recommendation = calculateFeeBumpSuggestion({
    currentTip: latestRaw?.tip as string | undefined,
    currentMaxL2GasPrice: latestRaw?.max_l2_gas_price as string | undefined
  });

  return {
    txHash,
    currentStatus,
    timeline,
    recommendation,
    explanation: explainStatus(currentStatus),
    diagnostics: {
      nonceConflict: detectNonceConflict({
        txNonce: latestRaw?.nonce as string | undefined
      }),
      note: 'Nonce conflict uses limited available metadata in this PoC.'
    }
  };
}
