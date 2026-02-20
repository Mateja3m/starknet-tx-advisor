import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getInfuraUrl(apiKey: string, network: string): string {
  const net = network === 'mainnet' ? 'mainnet' : 'sepolia';
  return `https://starknet-${net}.infura.io/v3/${apiKey}`;
}

export function resolvePrimaryRpcUrl(): string {
  if (process.env.STARKNET_RPC_URL) {
    return process.env.STARKNET_RPC_URL;
  }

  const apiKey = process.env.INFURA_API_KEY;
  const network = process.env.STARKNET_NETWORK || 'sepolia';
  if (apiKey) {
    return getInfuraUrl(apiKey, network);
  }

  return '';
}

export const config = {
  port: Number(process.env.COLLECTOR_PORT || 4000),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 5000),
  network: process.env.STARKNET_NETWORK || 'sepolia',
  sqlitePath: process.env.SQLITE_PATH || '../../db/sqlite/tx_advisor.sqlite',
  rpcUrls: [
    resolvePrimaryRpcUrl(),
    process.env.STARKNET_RPC_URL_FALLBACK_1 || '',
    process.env.STARKNET_RPC_URL_FALLBACK_2 || ''
  ].filter(Boolean)
};
