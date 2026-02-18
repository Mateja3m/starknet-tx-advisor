# Testing Guide (Android)

## 1) Setup

From repo root:

```bash
npm install
```

Start each app in separate terminals:

```bash
npm run start:dapp
npm run start:wallet
```

Build/install native apps on emulator:

```bash
npm run android:dapp
npm run android:wallet
```

## 2) Deep Link Sanity Checks

Open wallet directly:

```bash
adb shell am start -a android.intent.action.VIEW -d "srn-wallet://connect?payload=eyJ0eXBlIjoiQ09OTkVDVCIsImNhbGxiYWNrVXJsIjoic3JuLWRhcHA6Ly9jYWxsYmFjayIsInJlcXVlc3RJZCI6InRlc3QtMSIsInN0YXRlIjoic3RhdGUtMSIsIm5vbmNlIjoibm9uY2UtMSIsImFwcE5hbWUiOiJDbGlDb21tYW5kIn0%3D"
```

Open dApp callback directly:

```bash
adb shell am start -a android.intent.action.VIEW -d "srn-dapp://callback?payload=eyJyZXF1ZXN0SWQiOiJ0ZXN0LTEiLCJzdGF0ZSI6InN0YXRlLTEiLCJub25jZSI6Im5vbmNlLTEiLCJ0eXBlIjoiQ09OTkVDVCIsInN0YXR1cyI6IkFQUFJPVkVEIiwiZGF0YSI6eyJ3YWxsZXRBZGRyZXNzIjoiMHhNT0NLMTIzIiwic2Vzc2lvbklkIjoiczEyMyJ9fQ%3D%3D"
```

## 3) Flow Tests

### CONNECT (2 tests)

1. Positive connect
- In dApp Home tap `Connect Wallet`.
- In wallet tap `Approve`.
- Expected: dApp state becomes `CONNECTED`, session has `walletAddress` and `connectedAt`.

2. Reject connect
- Tap `Connect Wallet`.
- In wallet tap `Reject`.
- Expected: dApp remains disconnected, `Last Error` shows rejection.

### SIGN MESSAGE (2 tests)

1. Positive sign
- Go to `Sign` tab, input `hello starknet`, tap `Sign`.
- Approve in wallet.
- Expected: signature displayed in dApp.

2. Reject sign
- Repeat sign request, but tap `Reject` in wallet.
- Expected: no signature update, `Last Error` is set.

### EXECUTE TX (2 tests)

1. Positive tx
- Go to `Tx` tab and tap `Send Mock Tx`.
- Approve in wallet.
- Expected status progression: `CREATED -> REQUESTED -> WALLET_APPROVED -> CONFIRMED`.

2. Reject tx
- Send mock tx and reject in wallet.
- Expected: dApp status becomes `REJECTED` and shows error.

## 4) Troubleshooting

- App does not open from deep link:
  - Check app scheme in `app.json` (`srn-dapp`, `srn-wallet`).
  - Rebuild Android app after scheme changes: `npm run android:dapp` / `npm run android:wallet`.

- Callback not handled in dApp:
  - Check wallet request includes valid `callbackUrl`.
  - Check dApp logs for `STATE_MISMATCH` or `UNKNOWN_REQUEST`.

- Wallet shows empty payload:
  - Confirm request uses `payload=` query param with base64 JSON.

- AsyncStorage session not persisted:
  - Confirm `@react-native-async-storage/async-storage` installed in dApp workspace.

## 5) Useful Log Filters

```bash
adb logcat | grep -E "adapter|wallet"
```
