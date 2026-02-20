function toBigIntValue(value: bigint | string | number | undefined): bigint | null {
  if (value === undefined || value === null) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function bump12PercentRoundedUp(value: bigint): bigint {
  return (value * 112n + 99n) / 100n;
}

export function calculateFeeBumpSuggestion(txMeta: {
  currentTip?: bigint | string | number;
  currentMaxL2GasPrice?: bigint | string | number;
}): { shouldBump: boolean; suggestedTip?: string; suggestedMaxL2GasPrice?: string; rationale: string } {
  const tip = toBigIntValue(txMeta.currentTip);
  const gas = toBigIntValue(txMeta.currentMaxL2GasPrice);

  if (tip === null && gas === null) {
    return {
      shouldBump: false,
      rationale: 'Fee data is unavailable for this transaction, so no deterministic bump can be suggested.'
    };
  }

  const suggestedTip = tip !== null ? bump12PercentRoundedUp(tip).toString() : undefined;
  const suggestedMaxL2GasPrice = gas !== null ? bump12PercentRoundedUp(gas).toString() : undefined;

  return {
    shouldBump: true,
    suggestedTip,
    suggestedMaxL2GasPrice,
    rationale: 'Deterministic escalation rule applied: +12% to tip and max L2 gas price (rounded up).'
  };
}
