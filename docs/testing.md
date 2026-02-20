# Testing

## 1) Configure RPC provider

Create `.env` from root example:

```bash
cp .env.example .env
```

You need at least one working Starknet RPC URL.

### Option A: Infura (popular)
1. Create project key in Infura dashboard.
2. Set either:
   - `INFURA_API_KEY=<your_key>` and leave `STARKNET_RPC_URL=` empty, OR
   - set explicit `STARKNET_RPC_URL=https://starknet-sepolia.infura.io/v3/<your_key>`

### Option B: Alchemy (popular)
Set:

```env
STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/<your_api_key>
```

### Option C: Blast
Set:

```env
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

If a public endpoint becomes unstable, keep it empty and use key-based provider.

## 2) Optional fallbacks

```env
STARKNET_RPC_URL_FALLBACK_1=<second_provider_url>
STARKNET_RPC_URL_FALLBACK_2=<third_provider_url>
```

Collector tries primary, retries once, then fallback 1 and fallback 2.

## 3) Run locally

```bash
npm install
npm run dev:collector
npm run dev:web
```

Open `http://localhost:3000`.

## 4) Manual check

1. Paste `0x...` tx hash.
2. Click Analyze.
3. Confirm status badge, timeline, recommendation, raw JSON toggle, and export button.
4. Check collector health and RPC info:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/rpc/info
```

## 5) Unit tests

```bash
npm test
```

Covers:
- status normalization
- timeline ordering + dedupe
- fee bump rounding (+12%)
- nonce conflict rules
