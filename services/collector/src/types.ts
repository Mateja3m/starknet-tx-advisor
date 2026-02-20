export type SnapshotKind = 'status' | 'receipt' | 'error';

export type RpcError = {
  code: 'INVALID_TX_HASH' | 'RPC_UNAVAILABLE' | 'TX_NOT_FOUND' | 'INTERNAL';
  message: string;
  debug?: unknown;
};

export type RpcCallResult<T> = {
  ok: true;
  data: T;
  rpcUrl: string;
};

export type RpcCallFailure = {
  ok: false;
  error: RpcError;
};
