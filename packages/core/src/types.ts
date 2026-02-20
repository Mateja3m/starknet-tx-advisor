export type NormalizedStatus =
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'CANDIDATE'
  | 'PRE_CONFIRMED'
  | 'ACCEPTED_ON_L2'
  | 'ACCEPTED_ON_L1'
  | 'REVERTED'
  | 'REJECTED'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export type TxSnapshot = {
  ts: number;
  source: 'status' | 'receipt' | 'error';
  raw: unknown;
  normalized: NormalizedStatus;
  meta?: {
    rpcUrl?: string;
    attempt?: number;
  };
};

export type TimelineEntry = {
  ts: number;
  normalized: NormalizedStatus;
  details?: {
    blockNumber?: number;
    txIndex?: number;
    finality?: string;
  };
};

export type LifecycleTimeline = TimelineEntry[];

export type TxAnalysisResult = {
  txHash: string;
  currentStatus: NormalizedStatus;
  timeline: LifecycleTimeline;
  recommendation: {
    shouldBump: boolean;
    suggestedTip?: string;
    suggestedMaxL2GasPrice?: string;
    rationale: string;
  };
  explanation: {
    title: string;
    meaning: string;
    nextActions: string[];
  };
  diagnostics: {
    nonceConflict: {
      conflict: boolean;
      reason?: string;
    };
    note?: string;
  };
};
