# dApp App (`/apps/dapp`)

React Native Expo dApp that uses `@srn/adapter` to:
- connect to mock wallet
- sign message
- execute mock tx
- persist session in AsyncStorage

## Commands

From repo root:

```bash
npm install
npm run start:dapp
npm run android:dapp
```

## Deep Link Callback

Configured scheme:
- `srn-dapp://callback`

## Notes

- Android-only setup in this repository.
- The app validates callback `state` against pending request map before accepting responses.
