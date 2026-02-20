# starknet-tx-advisor

Ultra-lean PoC for Starknet transaction lifecycle and fee-escalation advice based on `tx_hash` analysis only.

## Prerequisites

- Node.js 18+
- npm 9+

## Environment setup

1. Copy root env file:

```bash
cp .env.example .env
```

2. Set at least one RPC URL:
- Prefer `STARKNET_RPC_URL` (Infura URL or any Starknet RPC endpoint)
- Optional fallbacks: `STARKNET_RPC_URL_FALLBACK_1`, `STARKNET_RPC_URL_FALLBACK_2`

If `STARKNET_RPC_URL` is empty and `INFURA_API_KEY` is set, collector attempts to build Infura URL automatically.

## Install

```bash
npm install
```

## Run (both services)

```bash
npm run dev
```

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

## Known limitations

- Scope is intentionally limited to per-`tx_hash` analysis.
- No global mempool visibility.
- No auth/accounts/wallet integration.
- Nonce conflict logic is best-effort and may be partial when account context is missing.
