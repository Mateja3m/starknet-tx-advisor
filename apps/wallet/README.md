# Mock Wallet App

Expo React Native mock wallet koji prima deep-link zahteve, prikazuje payload i vraća approve/reject odgovor dApp-u.

## Komande

Pokretanje iz root foldera:
- `npm install`
- `npm run start:wallet`
- `npm run android:wallet`

## Rute

- `srn-wallet://connect?payload=...`
- `srn-wallet://sign?payload=...`
- `srn-wallet://execute?payload=...`

## Mock potpis

- `base64(sha256(payload + "srn-mock-secret"))`
