# SMDAK Protocol (PoC)

## Transport

- Request: deep link to wallet (`smdak-wallet://...`) with `payload=<base64(json)>`
- Response: deep link callback to dApp (`smdak-dapp://callback`) with `payload=<base64(json)>`

## Schemes and Routes

Wallet routes:
- `smdak-wallet://connect?payload=...`
- `smdak-wallet://sign?payload=...`
- `smdak-wallet://execute?payload=...`

Callback route:
- `smdak-dapp://callback?payload=...`

## Request Schema

```json
{
  "type": "CONNECT | SIGN | EXECUTE_TX",
  "requestId": "string",
  "state": "string",
  "nonce": "string",
  "callbackUrl": "smdak-dapp://callback",
  "payload": {},
  "createdAt": 1739970000000
}
```

### Request examples

CONNECT:
```json
{
  "type": "CONNECT",
  "requestId": "connect-1739970000-100",
  "state": "A1B2C3D4",
  "nonce": "Z9Y8X7W6",
  "callbackUrl": "smdak-dapp://callback",
  "payload": { "appName": "SMDAK Starter dApp" }
}
```

EXECUTE_TX (swap):
```json
{
  "type": "EXECUTE_TX",
  "requestId": "tx-1739970100-200",
  "state": "SOME_STATE",
  "nonce": "SOME_NONCE",
  "callbackUrl": "smdak-dapp://callback",
  "payload": {
    "action": "SWAP",
    "quote": {
      "fromToken": "ETH",
      "toToken": "STRK",
      "inAmount": "1.0",
      "outAmount": "12.4500"
    }
  }
}
```

## Response Schema

```json
{
  "requestId": "string",
  "state": "string",
  "nonce": "string",
  "type": "CONNECT | SIGN | EXECUTE_TX",
  "status": "APPROVED | REJECTED | ERROR",
  "result": {},
  "errorCode": "string|null",
  "errorMessage": "string|null",
  "respondedAt": 1739970005000
}
```

### Response examples

APPROVED CONNECT:
```json
{
  "requestId": "connect-1739970000-100",
  "state": "A1B2C3D4",
  "nonce": "Z9Y8X7W6",
  "type": "CONNECT",
  "status": "APPROVED",
  "result": {
    "walletAddress": "0xMOCKabc123",
    "sessionId": "session-1739970001-9",
    "chain": "starknet"
  }
}
```

REJECTED:
```json
{
  "requestId": "tx-1739970100-200",
  "state": "SOME_STATE",
  "nonce": "SOME_NONCE",
  "type": "EXECUTE_TX",
  "status": "REJECTED",
  "result": null,
  "errorCode": "USER_REJECTED",
  "errorMessage": "Request rejected by user in mock wallet"
}
```

## Security Notes (PoC)

dApp validation requirements:
- `requestId` must exist in `pendingRequests`
- returned `state` must match stored state
- returned `nonce` must match stored nonce

If validation fails, dApp rejects callback and logs error.

## Error Codes

- `USER_REJECTED`: user rejected in wallet UI
- `UNKNOWN_REQUEST`: callback for unknown `requestId`
- `STATE_MISMATCH`: returned state differs from expected
- `NONCE_MISMATCH`: returned nonce differs from expected
- `MALFORMED_RESPONSE`: cannot decode/parse callback payload
- `UNSUPPORTED_TYPE`: wallet received unsupported request type
- `WALLET_OPEN_FAILED`: dApp could not open wallet deep link
