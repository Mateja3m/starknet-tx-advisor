# Starknet Mobile Developer Accelerator Kit (SMDAK)

SMDAK is a JavaScript-first React Native + Expo PoC that accelerates mobile Starknet onboarding by providing:
- a mobile wallet adapter protocol over deep links
- standardized React Native hooks for wallet and transaction flows
- a starter dApp template with two high-visibility demos (mock swap and mock mint)

This repository is intended for grant validation. Real wallet/protocol integrations are future milestones.

## What Problem It Solves

Mobile developers typically need to build wallet connectivity, request handling, and transaction UX from scratch.
SMDAK provides a working baseline that demonstrates end-to-end request/response lifecycle and app UX patterns.

## What’s Included

- `/apps/dapp`: Starter dApp Template (Expo RN)
- `/apps/wallet`: Mock Wallet (Expo RN)
- `/packages/adapter`: protocol builders/parsers/validation (pure JS)
- `/packages/hooks`: React hooks + state management + persistence (pure JS)
- `/docs`: protocol, testing, and grant milestones

## Architecture (high level)

- dApp uses `@smdak/hooks` (`useWallet`, `useTransaction`) for connect and tx lifecycle.
- hooks package uses `@smdak/adapter` to construct deep links and validate callbacks.
- wallet app receives `smdak-wallet://...` requests, approves/rejects, and returns to `smdak-dapp://callback`.
- dApp validates `requestId`, `state`, and `nonce`, then updates UI and stores data.

## Quickstart

Prerequisites:
- Node.js 18+
- Android SDK + emulator
- Xcode + iOS simulator (for iOS)

Install:

```bash
npm install
```

Run apps in separate terminals:

```bash
npm run start:dapp
npm run start:wallet
```

Build/run:

```bash
npm run android:dapp
npm run android:wallet
npm run ios:dapp
npm run ios:wallet
```

## End-to-End Test Steps

1. Open both apps (dApp + wallet).
2. In dApp Home, tap `Connect`.
3. Wallet opens incoming request; tap `Approve`.
4. Confirm dApp session is populated (`walletAddress`, `sessionId`, `connectedAt`).
5. In dApp DeFi tab: `Get Quote` then `Execute Swap`; approve in wallet.
6. In dApp NFT tab: `Mint NFT`; approve in wallet.
7. Check Logs tab for request/response events and confirmed transaction history.

Detailed testing matrix and deep-link commands:
- `/docs/testing.md`

## Screenshots (placeholders)

- `docs/screenshots/dapp-home.png`
- `docs/screenshots/dapp-defi.png`
- `docs/screenshots/dapp-nft.png`
- `docs/screenshots/wallet-request.png`

## Known Limitations

- Mock wallet only (no real Starknet account integration)
- Mock signature and mock tx hash only
- No real on-chain confirmation polling
- No production-grade cryptographic session model

## Next Steps

- Integrate real Starknet wallet/account providers
- Replace mock tx flow with actual Starknet transaction submission and receipt polling
- Support multiple wallets and wallet discovery
- Harden protocol signing/encryption and replay protections
