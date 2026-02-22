import path from 'node:path';
import dotenv from 'dotenv';
import { getRpcUrls, type StarknetNetwork } from './lib/rpc.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const network: StarknetNetwork = process.env.STARKNET_NETWORK === 'mainnet' ? 'mainnet' : 'sepolia';

export const config = {
  port: Number(process.env.COLLECTOR_PORT || 4000),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 5000),
  network,
  sqlitePath: process.env.SQLITE_PATH || '../../db/sqlite/tx_advisor.sqlite',
  rpcUrls: getRpcUrls(network)
};
