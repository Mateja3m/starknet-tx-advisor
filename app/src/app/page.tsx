'use client';

import { useMemo, useState } from 'react';

type TxResponse = {
  txHash: string;
  currentStatus: string;
  timeline: Array<{ ts: number; normalized: string }>;
  recommendation: {
    shouldBump: boolean;
    suggestedTip?: string;
    suggestedMaxL2GasPrice?: string;
    rationale: string;
  };
  analysis: {
    explanation: {
      title: string;
      meaning: string;
      nextActions: string[];
    };
    diagnostics: {
      nonceConflict: { conflict: boolean; reason?: string };
      note?: string;
    };
  };
  raw?: unknown;
  report: { exportJson: unknown };
};

const baseUrl = process.env.NEXT_PUBLIC_COLLECTOR_URL || 'http://localhost:4000';

export default function HomePage() {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<TxResponse | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const statusClass = useMemo(() => {
    const s = data?.currentStatus || '';
    if (s.includes('ACCEPTED')) return 'badge ok';
    if (s.includes('REJECT') || s.includes('REVERT') || s.includes('NOT_FOUND')) return 'badge err';
    return 'badge';
  }, [data?.currentStatus]);

  async function analyze() {
    setError('');
    setLoading(true);
    setData(null);

    try {
      const watchRes = await fetch(`${baseUrl}/watch`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ txHash })
      });

      if (!watchRes.ok) {
        const text = await watchRes.text();
        throw new Error(text || 'Failed to start watch.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));

      let lastError = 'Analysis fetch failed.';
      for (let i = 0; i < 4; i += 1) {
        const txRes = await fetch(`${baseUrl}/tx/${txHash}?includeRaw=1`);
        if (txRes.ok) {
          const json = (await txRes.json()) as TxResponse;
          setData(json);
          return;
        }

        lastError = await txRes.text();
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      throw new Error(lastError || 'Analysis fetch failed.');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    if (!data?.report?.exportJson) return;
    const blob = new Blob([JSON.stringify(data.report.exportJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tx-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container">
      <h1>Starknet Transaction Lifecycle & Fee Escalation Advisor (STLFA)</h1>
      <p>Enter a tx hash to inspect lifecycle snapshots and deterministic fee escalation advice.</p>

      <section className="card">
        <div className="row">
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value.trim())}
            placeholder="0x..."
          />
          <button onClick={analyze} disabled={loading || !txHash}>{loading ? 'Analyzing...' : 'Analyze'}</button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {data ? (
        <>
          <section className="card">
            <h2>Current Status</h2>
            <span className={statusClass}>{data.currentStatus}</span>
          </section>

          <section className="card">
            <h2>Timeline</h2>
            <ul className="timeline">
              {data.timeline.map((t) => (
                <li key={`${t.ts}-${t.normalized}`}>
                  <strong>{new Date(t.ts).toLocaleTimeString()}</strong> - {t.normalized}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Diagnostics</h2>
            <p><strong>{data.analysis.explanation.title}</strong>: {data.analysis.explanation.meaning}</p>
            <ul>
              {data.analysis.explanation.nextActions.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p>Nonce conflict: {data.analysis.diagnostics.nonceConflict.conflict ? 'Likely' : 'No signal'}</p>
            {data.analysis.diagnostics.nonceConflict.reason ? <p>{data.analysis.diagnostics.nonceConflict.reason}</p> : null}
          </section>

          <section className="card">
            <h2>Fee Recommendation</h2>
            <p>{data.recommendation.rationale}</p>
            {data.recommendation.shouldBump ? (
              <>
                <p>Suggested tip: {data.recommendation.suggestedTip ?? 'n/a'}</p>
                <p>Suggested maxL2GasPrice: {data.recommendation.suggestedMaxL2GasPrice ?? 'n/a'}</p>
              </>
            ) : (
              <p>No deterministic bump suggestion available.</p>
            )}
          </section>

          <section className="card">
            <div className="row">
              <button className="secondary" onClick={() => setShowRaw((v) => !v)}>{showRaw ? 'Hide' : 'Show'} Raw JSON</button>
              <button className="secondary" onClick={exportReport}>Export Report JSON</button>
            </div>
            {showRaw ? <pre>{JSON.stringify(data.raw, null, 2)}</pre> : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
