# Grant Milestones - SMDAK PoC

## Implemented in this PoC

1. Monorepo baseline for mobile Starknet onboarding
- `apps + packages` structure
- JavaScript-only implementation
- Expo managed workflow for both dApp and wallet

2. Mobile Wallet Adapter protocol (mock)
- Deep-link request/response transport
- Base64 JSON query payload
- Request correlation with `requestId`
- Callback validation with `state` and `nonce`

3. Standardized React Native hooks
- `useWallet()` for connect/disconnect/session
- `useTransaction()` for tx requests and lifecycle state
- persisted session, logs, and tx history via AsyncStorage

4. Starter dApp with high-visibility demos
- Mock DeFi swap flow with quote + execute request
- Mock NFT mint flow with execute request
- lifecycle progression: `CREATED -> REQUESTED -> WALLET_APPROVED -> CONFIRMED`

5. Mock wallet app
- Incoming request decoding and display
- Approve/reject UX
- mock connect/session, mock signature, mock tx hash callback

## Remaining for production integrations

1. Real Starknet wallet interoperability
- Integrate real account/session models
- Formalize wallet capability discovery and compatibility matrix

2. Real protocol integrations
- Replace local mock swap/mint with real protocol calls
- Add robust tx receipt polling and failure handling

3. Security hardening
- Stronger anti-replay guarantees
- payload signing/authentication and optional encryption
- production key/session lifecycle controls

4. Reliability and observability
- Add structured telemetry and analytics hooks
- Add retry, timeout, and offline resilience strategy

5. QA and release readiness
- Automated tests (unit/integration/e2e)
- CI pipelines and release automation
- Multi-device compatibility validation
