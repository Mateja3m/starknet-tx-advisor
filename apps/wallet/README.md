# Mock Wallet App (`/apps/wallet`)

React Native Expo wallet simulator for SRN protocol PoC.
It receives deep-link requests, renders payload, and sends approve/reject callback to dApp.

## Commands

From repo root:

```bash
npm install
npm run start:wallet
npm run android:wallet
```

## Supported Routes

- `srn-wallet://connect?payload=...`
- `srn-wallet://sign?payload=...`
- `srn-wallet://execute?payload=...`

## Mock Signature

On SIGN approve, signature is generated as:

```text
base64(sha256(payload + "srn-mock-secret"))
```

This is testing-only and not a Starknet signature.
