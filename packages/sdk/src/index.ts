export async function logTxMeta(input: {
  collectorUrl?: string;
  txHash: string;
  nonce?: string;
  tip?: string;
  maxL2GasPrice?: string;
}): Promise<{ ok: boolean }> {
  const base = input.collectorUrl || 'http://localhost:4000';

  const watchRes = await fetch(`${base}/watch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ txHash: input.txHash })
  });

  if (!watchRes.ok) {
    throw new Error(`watch failed: ${await watchRes.text()}`);
  }

  const metaRes = await fetch(`${base}/txmeta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      txHash: input.txHash,
      nonce: input.nonce,
      tip: input.tip,
      maxL2GasPrice: input.maxL2GasPrice
    })
  });

  if (!metaRes.ok) {
    throw new Error(`txmeta failed: ${await metaRes.text()}`);
  }

  return { ok: true };
}
