# API

Base URL: `http://localhost:4000`

## GET /health

Response:

```json
{ "ok": true, "service": "collector" }
```

## GET /rpc/info

Response:

```json
{
  "activeRpcUrl": "https://...",
  "network": "sepolia",
  "fallbacksConfigured": true
}
```

## POST /watch

Request:

```json
{ "txHash": "0x..." }
```

Response:

```json
{ "ok": true, "txHash": "0x..." }
```

Errors:
- `INVALID_TX_HASH`

## GET /tx/:hash

Query:
- `includeRaw=1` (optional)

Response (example):

```json
{
  "txHash": "0x...",
  "currentStatus": "RECEIVED",
  "timeline": [{ "ts": 1720000000000, "normalized": "SUBMITTED" }],
  "recommendation": { "shouldBump": false, "rationale": "..." },
  "analysis": {
    "explanation": { "title": "...", "meaning": "...", "nextActions": [] },
    "diagnostics": { "nonceConflict": { "conflict": false } }
  },
  "raw": [],
  "report": { "exportJson": {} }
}
```

Errors:
- `INVALID_TX_HASH`
- `TX_NOT_FOUND`
- `RPC_UNAVAILABLE`
- `INTERNAL`
