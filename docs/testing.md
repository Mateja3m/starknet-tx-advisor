# SMDAK Testing Guide

## 1) Environment Setup

Prerequisites:
- Node.js 18+
- Android Studio + emulator
- Xcode + iOS simulator
- `adb` and `xcrun` available in PATH

Install dependencies:

```bash
npm install
```

Run Metro for each app (separate terminals):

```bash
npm run start:dapp
npm run start:wallet
```

Build and run apps:

```bash
npm run android:dapp
npm run android:wallet
npm run ios:dapp
npm run ios:wallet
```

## 2) Deep Link Command Tests

### Android

Wallet open test:

```bash
adb shell am start -a android.intent.action.VIEW -d "smdak-wallet://connect?payload=eyJ0eXBlIjoiQ09OTkVDVCIsInJlcXVlc3RJZCI6InQxIiwic3RhdGUiOiJzMSIsIm5vbmNlIjoibjEiLCJjYWxsYmFja1VybCI6InNtZGFrLWRhcHA6Ly9jYWxsYmFjayIsInBheWxvYWQiOnsiYXBwTmFtZSI6IkNMSSJ9fQ%3D%3D"
```

dApp callback test:

```bash
adb shell am start -a android.intent.action.VIEW -d "smdak-dapp://callback?payload=eyJyZXF1ZXN0SWQiOiJ0MSIsInN0YXRlIjoiczEiLCJub25jZSI6Im4xIiwidHlwZSI6IkNPTk5FQ1QiLCJzdGF0dXMiOiJBUFBST1ZFRCIsInJlc3VsdCI6eyJ3YWxsZXRBZGRyZXNzIjoiMHhNT0NLIiwic2Vzc2lvbklkIjoicy0xIiwiY2hhaW4iOiJzdGFya25ldCJ9fQ%3D%3D"
```

### iOS

Wallet open test:

```bash
xcrun simctl openurl booted "smdak-wallet://connect?payload=eyJ0eXBlIjoiQ09OTkVDVCIsInJlcXVlc3RJZCI6InQxIiwic3RhdGUiOiJzMSIsIm5vbmNlIjoibjEiLCJjYWxsYmFja1VybCI6InNtZGFrLWRhcHA6Ly9jYWxsYmFjayIsInBheWxvYWQiOnsiYXBwTmFtZSI6IkNMSSJ9fQ%3D%3D"
```

dApp callback test:

```bash
xcrun simctl openurl booted "smdak-dapp://callback?payload=eyJyZXF1ZXN0SWQiOiJ0MSIsInN0YXRlIjoiczEiLCJub25jZSI6Im4xIiwidHlwZSI6IkNPTk5FQ1QiLCJzdGF0dXMiOiJBUFBST1ZFRCIsInJlc3VsdCI6eyJ3YWxsZXRBZGRyZXNzIjoiMHhNT0NLIiwic2Vzc2lvbklkIjoicy0xIiwiY2hhaW4iOiJzdGFya25ldCJ9fQ%3D%3D"
```

## 3) Manual Test Cases

### Connect flow

Case 1: approve connect
1. Open dApp Home
2. Tap `Connect`
3. In wallet, tap `Approve`
4. Expected: dApp status `CONNECTED`, session fields populated

Case 2: reject connect
1. Tap `Connect`
2. In wallet, tap `Reject`
3. Expected: no session, error shown/logged

### Mock swap flow (DeFi)

Case 1: successful swap
1. Open DeFi tab
2. Enter tokens/amount and tap `Get Quote`
3. Tap `Execute Swap` and approve in wallet
4. Expected status: `CREATED -> REQUESTED -> WALLET_APPROVED -> CONFIRMED`

Case 2: rejected swap
1. Repeat swap request
2. Tap `Reject` in wallet
3. Expected: tx status `REJECTED`, log entry created

### Mock mint flow (NFT)

Case 1: successful mint
1. Open NFT tab
2. Enter collection and receiver
3. Tap `Mint NFT` and approve in wallet
4. Expected status progression to `CONFIRMED`

Case 2: rejected mint
1. Submit mint request
2. Reject in wallet
3. Expected: tx status `REJECTED` with log entry

### Reject flow (general)

Case 1: reject connect
- Confirm `USER_REJECTED` appears in logs/error state

Case 2: reject execute_tx
- Confirm tx state transitions to `REJECTED`

### Invalid state flow

Case 1: tampered callback state
1. Start a real request from dApp
2. Before approving, manually send callback with wrong `state`
3. Expected: dApp rejects callback with `STATE_MISMATCH`

Case 2: tampered nonce
1. Send callback with incorrect `nonce`
2. Expected: dApp rejects callback with `NONCE_MISMATCH`

## 4) Troubleshooting

- Deep link does not open app:
  - verify scheme in `app.json`
  - reinstall/rebuild app after scheme changes

- Callback ignored:
  - confirm callback route starts with `smdak-dapp://callback`
  - check Logs tab for validation errors

- No session persistence:
  - verify `@react-native-async-storage/async-storage` installation

- Track runtime logs:

```bash
adb logcat | grep -E "smdak-hooks|smdak-wallet"
```
