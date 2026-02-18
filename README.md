# Starknet React Native Mobile Wallet Adapter PoC

Minimal JavaScript-only Proof-of-Concept that demonstrates a deep-link protocol between:
- a React Native Expo dApp (`/apps/dapp`)
- a React Native Expo Mock Wallet (`/apps/wallet`)
- a shared adapter package (`/packages/adapter`)

This PoC proves connect/sign/execute flows without a real Starknet wallet.

## Architecture

```text
+-------------------------+             +-------------------------+
| dApp (srn-dapp://)      |  deep link  | Mock Wallet             |
| apps/dapp               | ----------> | apps/wallet             |
|                         |             | (srn-wallet://)         |
| - useWallet()           |             | - parse request         |
| - useTransaction()      |             | - approve/reject        |
| - AsyncStorage session  | <---------- | - callback to dApp      |
+------------+------------+   callback  +------------+------------+
             |                                       |
             +----------- shared logic --------------+
                         packages/adapter
```

## Monorepo Layout

```text
/apps/dapp
/apps/wallet
/packages/adapter
/docs
```

## How To Run

Prerequisites:
- Node.js 18+
- Android SDK + emulator
- `adb` available in PATH

Install dependencies:

```bash
npm install
```

Start dApp:

```bash
npm run start:dapp
```

Start wallet (second terminal):

```bash
npm run start:wallet
```

Build/run on Android:

```bash
npm run android:dapp
npm run android:wallet
```

## End-to-End Test (Android)

1. Open both apps on the emulator.
2. In dApp Home, tap `Connect Wallet`.
3. Wallet opens `Incoming Request`; tap `Approve`.
4. dApp receives callback, validates `state`, and stores session.
5. Repeat for `Sign` and `Send Mock Tx` flows.

For manual command-based tests and deep-link payload samples see:
- `/docs/testing.md`

## Security Basics Included

- Every request carries: `requestId`, `state`, `nonce`.
- Wallet echoes `requestId` and `state`.
- dApp validates `state` before accepting response.
- Payloads are base64-encoded JSON via query param.

## Known Limitations

- Mock signature only: `base64(sha256(payload + secret))`.
- No real Starknet account/session cryptography.
- No transport encryption beyond standard app deep-link transport.
- No background request queue/retry strategy.
- Android-only docs and setup in this repo.

## Documentation

- Protocol spec: `/docs/protocol.md`
- Testing + troubleshooting: `/docs/testing.md`
- App setup:
  - `/apps/dapp/README.md`
  - `/apps/wallet/README.md`
