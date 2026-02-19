# SMDAK Mock Wallet

Expo React Native mock wallet that receives deep-link requests from the starter dApp and returns approve/reject callbacks.

## Run

From repo root:
- `npm install`
- `npm run start:wallet`
- `npm run android:wallet`
- `npm run ios:wallet`

Supported routes:
- `smdak-wallet://connect?payload=...`
- `smdak-wallet://sign?payload=...`
- `smdak-wallet://execute?payload=...`
