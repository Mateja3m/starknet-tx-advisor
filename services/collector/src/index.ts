import express from 'express';
import path from 'node:path';
import { buildAnalysis } from './analysis.js';
import { config } from './config.js';
import { createDb } from './db.js';
import { inspectRpcUrls } from './lib/rpc.js';
import { StarknetRpcClient } from './rpc.js';
import { createWatcherService } from './watcher.js';

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

const db = createDb(config.sqlitePath);
const rpc = new StarknetRpcClient(config.rpcUrls, config.network);
const watchers = createWatcherService({ db, rpc, pollIntervalMs: config.pollIntervalMs });

function invalidTxHash(hash: string): boolean {
  return !/^0x[a-fA-F0-9]{8,}$/.test(hash);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'collector', sqliteFile: path.basename(config.sqlitePath) });
});

app.get('/rpc/info', (_req, res) => {
  res.json({
    activeRpcUrl: rpc.getActiveRpcUrl() || config.rpcUrls[0] || null,
    network: config.network,
    configuredRpcUrls: config.rpcUrls.length,
    fallbacksConfigured: Boolean(config.rpcUrls[1] || config.rpcUrls[2])
  });
});

app.get('/rpc/check', async (_req, res) => {
  const checks = await inspectRpcUrls(config.rpcUrls);
  res.json({
    network: config.network,
    configuredRpcUrls: config.rpcUrls.length,
    checks
  });
});

app.post('/watch', async (req, res) => {
  const txHash = String(req.body?.txHash || '');
  if (invalidTxHash(txHash)) {
    res.status(400).json({ error: { code: 'INVALID_TX_HASH', message: 'txHash must be 0x-prefixed hex string.' } });
    return;
  }

  const classHashRes = await rpc.postJsonRpc<unknown>('starknet_getClassHashAt', ['latest', txHash]);
  if (classHashRes.ok) {
    res.status(400).json({
      error: {
        code: 'INVALID_TX_HASH',
        message: 'Please enter a transaction hash (0x...), not an account or contract address.'
      }
    });
    return;
  }
  if (classHashRes.error.code === 'RPC_UNAVAILABLE') {
    res.status(503).json({ error: classHashRes.error });
    return;
  }

  watchers.start(txHash);
  res.json({ ok: true, txHash });
});

app.post('/txmeta', (req, res) => {
  const txHash = String(req.body?.txHash || '');
  if (invalidTxHash(txHash)) {
    res.status(400).json({ error: { code: 'INVALID_TX_HASH', message: 'txHash must be valid.' } });
    return;
  }

  // PoC: accepted but not persisted separately to keep scope minimal.
  res.json({ ok: true });
});

app.get('/tx/:hash', (req, res) => {
  const txHash = String(req.params.hash || '');
  if (invalidTxHash(txHash)) {
    res.status(400).json({ error: { code: 'INVALID_TX_HASH', message: 'Invalid tx hash.' } });
    return;
  }

  const snapshots = db.getSnapshots(txHash);
  if (!snapshots.length) {
    res.status(404).json({ error: { code: 'TX_NOT_FOUND', message: 'No snapshots found for tx hash.' } });
    return;
  }

  const analysis = buildAnalysis(txHash, snapshots);
  const includeRaw = req.query.includeRaw === '1';

  res.json({
    txHash,
    analysis,
    timeline: analysis.timeline,
    currentStatus: analysis.currentStatus,
    recommendation: analysis.recommendation,
    raw: includeRaw ? snapshots : undefined,
    report: {
      exportJson: {
        txHash,
        generatedAt: Date.now(),
        analysis,
        snapshots: includeRaw ? snapshots : undefined
      }
    }
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected collector error.', debug: String(err) } });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`collector listening on http://localhost:${config.port}`);
});
