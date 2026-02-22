#!/usr/bin/env node

const FALLBACK_RPC_URLS = {
  mainnet: [
    'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
    'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/docs-demo'
  ],
  sepolia: [
    'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/docs-demo'
  ]
};

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return '';
  return process.argv[idx + 1] || '';
}

function parseCsv(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function uniq(values) {
  return [...new Set(values)];
}

function infuraUrl(network, apiKey) {
  return `https://starknet-${network}.infura.io/v3/${apiKey}`;
}

function alchemyUrl(network, apiKey) {
  return `https://starknet-${network}.g.alchemy.com/starknet/version/rpc/v0_7/${apiKey}`;
}

function getRpcUrls(network) {
  const scopedCsv =
    network === 'mainnet'
      ? parseCsv(process.env.NEXT_PUBLIC_STARKNET_RPC_URLS_MAINNET || process.env.STARKNET_RPC_URLS_MAINNET)
      : parseCsv(process.env.NEXT_PUBLIC_STARKNET_RPC_URLS_SEPOLIA || process.env.STARKNET_RPC_URLS_SEPOLIA);

  const legacyNetwork = process.env.STARKNET_NETWORK === 'mainnet' ? 'mainnet' : 'sepolia';
  const legacyUrls =
    legacyNetwork === network
      ? [
          process.env.STARKNET_RPC_URL || '',
          process.env.STARKNET_RPC_URL_FALLBACK_1 || '',
          process.env.STARKNET_RPC_URL_FALLBACK_2 || ''
        ].filter(Boolean)
      : [];

  const infuraApiKey = process.env.INFURA_API_KEY || process.env.STARKNET_INFURA_API_KEY || '';
  const alchemyApiKey = process.env.ALCHEMY_API_KEY || process.env.STARKNET_ALCHEMY_API_KEY || '';
  const providerUrls = [
    infuraApiKey ? infuraUrl(network, infuraApiKey) : '',
    alchemyApiKey ? alchemyUrl(network, alchemyApiKey) : ''
  ].filter(Boolean);

  return uniq([...scopedCsv, ...legacyUrls, ...providerUrls, ...FALLBACK_RPC_URLS[network]]);
}

async function rpcCall(rpcUrl, method, params = []) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${rpcUrl}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }
  return json.result;
}

async function pickHealthyRpc(network) {
  const urls = getRpcUrls(network);
  let lastErr = 'unknown error';
  for (const url of urls) {
    try {
      const chainId = await rpcCall(url, 'starknet_chainId');
      return { url, chainId, urls };
    } catch (err) {
      lastErr = String(err);
    }
  }
  throw new Error(`All RPC URLs failed for ${network}. Tried: ${urls.join(', ')}. Last error: ${lastErr}`);
}

async function findRecentTxHash(rpcUrl) {
  const blockNumber = await rpcCall(rpcUrl, 'starknet_blockNumber');
  const block = await rpcCall(rpcUrl, 'starknet_getBlockWithTxHashes', [{ block_number: blockNumber }]);
  const txs = Array.isArray(block?.transactions) ? block.transactions : [];
  if (!txs.length) {
    throw new Error(`No transactions found in block ${blockNumber}`);
  }
  return String(txs[0]);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function looksPlaceholder(v) {
  return !v || v.includes('PUT_A_REAL_TX_HASH_PLACEHOLDER');
}

async function main() {
  const network = arg('--network') === 'mainnet' ? 'mainnet' : 'sepolia';
  const txFlag = arg('--tx');
  const txEnv = network === 'mainnet' ? process.env.MAINNET_TX_HASH : process.env.SEPOLIA_TX_HASH;
  const healthy = await pickHealthyRpc(network);

  let txHash = txFlag || txEnv || '';
  if (looksPlaceholder(txHash)) {
    txHash = await findRecentTxHash(healthy.url);
    console.log(`No explicit tx hash provided, using latest block tx: ${txHash}`);
  }

  const tx = await rpcCall(healthy.url, 'starknet_getTransactionByHash', [txHash]);
  const receipt = await rpcCall(healthy.url, 'starknet_getTransactionReceipt', [txHash]);

  assert(tx && typeof tx === 'object', 'Transaction response must be an object');
  assert(receipt && typeof receipt === 'object', 'Receipt response must be an object');
  assert(tx.transaction_hash === txHash || receipt.transaction_hash === txHash, 'transaction_hash missing or mismatched');
  assert(typeof tx.type === 'string', 'Transaction type is missing');

  const status =
    receipt.finality_status ||
    receipt.execution_status ||
    receipt.status ||
    tx.finality_status ||
    tx.status ||
    'UNKNOWN';

  console.log(`RPC: ${healthy.url}`);
  console.log(`Summary: chain=${healthy.chainId} txType=${tx.type} status=${status}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`RPC test failed: ${String(err?.message || err)}`);
  console.error('Tip: pass another transaction hash with --tx, or try the other network.');
  process.exit(1);
});
