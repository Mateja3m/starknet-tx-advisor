export type StarknetNetwork = 'mainnet' | 'sepolia';

const DEFAULT_RPC_URLS: Record<StarknetNetwork, string[]> = {
  mainnet: [
    'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
    'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/docs-demo'
  ],
  sepolia: [
    'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/docs-demo'
  ]
};

function parseCsv(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function infuraUrl(network: StarknetNetwork, apiKey: string): string {
  return `https://starknet-${network}.infura.io/v3/${apiKey}`;
}

function alchemyUrl(network: StarknetNetwork, apiKey: string): string {
  return `https://starknet-${network}.g.alchemy.com/starknet/version/rpc/v0_7/${apiKey}`;
}

export function getRpcUrls(network: StarknetNetwork): string[] {
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

  return unique([...scopedCsv, ...legacyUrls, ...providerUrls, ...DEFAULT_RPC_URLS[network]]);
}

async function checkRpcUrl(rpcUrl: string): Promise<{ ok: true; chainId: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'starknet_chainId', params: [] })
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
    if (json.error) {
      return { ok: false, error: json.error.message || 'RPC returned error' };
    }
    if (!json.result || typeof json.result !== 'string') {
      return { ok: false, error: 'Missing chain id result' };
    }

    return { ok: true, chainId: json.result };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function pickHealthyRpc(network: StarknetNetwork): Promise<{ rpcUrl: string; chainId: string } | null> {
  const urls = getRpcUrls(network);
  for (const rpcUrl of urls) {
    const result = await checkRpcUrl(rpcUrl);
    if (result.ok) {
      return { rpcUrl, chainId: result.chainId };
    }
  }
  return null;
}
