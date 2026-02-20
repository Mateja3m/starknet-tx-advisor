function toBigIntSafe(value: string | number | undefined): bigint | null {
  if (value === undefined || value === null) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export function detectNonceConflict(params: {
  txNonce?: string | number;
  pendingNonces?: Array<string | number>;
  currentAccountNonce?: string | number;
}): { conflict: boolean; reason?: string } {
  const txNonce = toBigIntSafe(params.txNonce);
  const accountNonce = toBigIntSafe(params.currentAccountNonce);
  const pending = (params.pendingNonces ?? []).map((n) => toBigIntSafe(n)).filter((n): n is bigint => n !== null);

  if (txNonce !== null && pending.some((n) => n === txNonce)) {
    return { conflict: true, reason: 'Transaction nonce matches another pending nonce.' };
  }

  if (txNonce !== null && accountNonce !== null && txNonce < accountNonce) {
    return { conflict: true, reason: 'Transaction nonce is lower than current account nonce and is likely already used.' };
  }

  return { conflict: false };
}
