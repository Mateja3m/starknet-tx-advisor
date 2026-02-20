import { setTimeout as delay } from 'node:timers/promises';
import type { RpcCallFailure, RpcCallResult } from './types.js';

type JsonRpcSuccess<T> = { jsonrpc: '2.0'; id: number; result: T };
type JsonRpcErr = { jsonrpc: '2.0'; id: number; error: { code: number; message: string; data?: unknown } };

export class StarknetRpcClient {
  private id = 0;
  private activeRpcUrl = '';

  constructor(private rpcUrls: string[]) {}

  getActiveRpcUrl(): string {
    return this.activeRpcUrl;
  }

  private async callSingleUrl<T>(rpcUrl: string, method: string, params: unknown[]): Promise<RpcCallResult<T> | RpcCallFailure> {
    const payload = {
      jsonrpc: '2.0',
      id: ++this.id,
      method,
      params
    };

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.status >= 500) {
          if (attempt < 2) {
            await delay(300);
            continue;
          }
          return { ok: false, error: { code: 'RPC_UNAVAILABLE', message: `RPC 5xx from ${rpcUrl}` } };
        }

        if (!res.ok) {
          return { ok: false, error: { code: 'RPC_UNAVAILABLE', message: `RPC HTTP ${res.status}`, debug: await res.text() } };
        }

        const json = (await res.json()) as JsonRpcSuccess<T> | JsonRpcErr;
        if ('error' in json) {
          const msg = json.error.message || 'RPC error';
          if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('transaction_hash_not_found')) {
            return { ok: false, error: { code: 'TX_NOT_FOUND', message: msg, debug: json.error } };
          }

          return { ok: false, error: { code: 'RPC_UNAVAILABLE', message: msg, debug: json.error } };
        }

        this.activeRpcUrl = rpcUrl;
        return { ok: true, data: json.result, rpcUrl };
      } catch (error) {
        if (attempt < 2) {
          await delay(300);
          continue;
        }

        return {
          ok: false,
          error: { code: 'RPC_UNAVAILABLE', message: `Network/timeout failed for ${rpcUrl}`, debug: String(error) }
        };
      }
    }

    return { ok: false, error: { code: 'RPC_UNAVAILABLE', message: 'Unknown RPC failure' } };
  }

  async postJsonRpc<T>(method: string, params: unknown[]): Promise<RpcCallResult<T> | RpcCallFailure> {
    if (!this.rpcUrls.length) {
      return { ok: false, error: { code: 'RPC_UNAVAILABLE', message: 'No RPC URLs configured.' } };
    }

    let lastFailure: RpcCallFailure = { ok: false, error: { code: 'RPC_UNAVAILABLE', message: 'RPC call failed' } };

    for (const rpcUrl of this.rpcUrls) {
      const result = await this.callSingleUrl<T>(rpcUrl, method, params);
      if (result.ok) {
        return result;
      }
      lastFailure = result;
    }

    return lastFailure;
  }
}
