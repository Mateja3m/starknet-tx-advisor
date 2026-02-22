# Starknet Transaction Lifecycle & Fee Escalation Advisor (STLFA)

Ultra-lean PoC for Starknet transaction lifecycle and fee-escalation advice based on `tx_hash` analysis only.

## Prerequisites

- Node.js 18+
- npm 9+

## Environment setup

1. Copy root env file:

```bash
cp .env.example .env
```

2. Pick network with a single variable:
- `STARKNET_NETWORK=mainnet` or `STARKNET_NETWORK=sepolia`
- That's enough for default behavior (the app has built-in public RPC fallbacks for both networks).
- No wallet is required.

3. Optional (only if you want custom providers): set comma-separated RPC URL lists
- `NEXT_PUBLIC_STARKNET_RPC_URLS_MAINNET`
- `NEXT_PUBLIC_STARKNET_RPC_URLS_SEPOLIA`

Resolution order:
1. `NEXT_PUBLIC_STARKNET_RPC_URLS_<NETWORK>`
2. Legacy `STARKNET_RPC_URL` + `STARKNET_RPC_URL_FALLBACK_1/2` (for selected `STARKNET_NETWORK`)
3. Provider URLs built from `INFURA_API_KEY` / `ALCHEMY_API_KEY`
4. Built-in public fallback endpoints

Minimal example:

```env
STARKNET_NETWORK=sepolia
NEXT_PUBLIC_COLLECTOR_URL=http://localhost:4000
```

## Install

```bash
npm install
```

## Run (both services)

```bash
npm run dev
```

Network switch flow (single env variable):
1. edit `.env` and set `STARKNET_NETWORK=mainnet` or `STARKNET_NETWORK=sepolia`
2. restart dev servers (`Ctrl+C`, then `npm run dev`)
3. verify backend network:

```bash
curl http://localhost:4000/rpc/info
```

Quick switch command (macOS/Linux):

```bash
sed -i '' 's/^STARKNET_NETWORK=.*/STARKNET_NETWORK=mainnet/' .env
# or
sed -i '' 's/^STARKNET_NETWORK=.*/STARKNET_NETWORK=sepolia/' .env```

Or separately:

```bash
npm run dev:collector
npm run dev:web
```

## Analyze a tx hash

1. Open web app at `http://localhost:3000`
2. Enter tx hash (`0x...`)
3. Click **Analyze**
4. UI shows:
- current status badge
- lifecycle timeline
- status explanation + actions
- fee bump recommendation
- raw JSON toggle
- export report JSON button

If you paste an account/contract address instead of a transaction hash, the app returns:
`Please enter a transaction hash (0x...), not an account or contract address.`

## RPC Integration Test Script

Run lightweight Starknet JSON-RPC integration checks:

```bash
npm run test:rpc -- --network mainnet --tx <hash>
npm run test:rpc -- --network sepolia --tx <hash>
```

The script:
1. Selects a healthy RPC endpoint from configured URLs/fallbacks
2. Calls `starknet_getTransactionByHash`
3. Calls `starknet_getTransactionReceipt`
4. Asserts required fields exist (`transaction_hash`, `type`, receipt status fields)
5. Prints summary: `chain`, `txType`, `status`

You can also set:

```env
MAINNET_TX_HASH=<PUT_A_REAL_TX_HASH_PLACEHOLDER>
SEPOLIA_TX_HASH=<PUT_A_REAL_TX_HASH_PLACEHOLDER>
```

Public transaction hashes can be copied from Voyager or StarkScan.

## Known limitations

- Scope is intentionally limited to per-`tx_hash` analysis.
- No global mempool visibility.
- No auth/accounts/wallet integration.
- Nonce conflict logic is best-effort and may be partial when account context is missing.
