# Starknet React Native Mobile Wallet Adapter PoC

Minimal JavaScript Proof-of-Concept za deep-link protokol između dApp aplikacije i Mock Wallet aplikacije.

## Sadržaj repozitorijuma

- `/apps/dapp` Expo React Native dApp
- `/apps/wallet` Expo React Native Mock Wallet
- `/packages/adapter` deljeni JavaScript adapter
- `/docs` protokol i test vodič

## Pokretanje

Preduslovi:
- Node.js 18+
- Android SDK i emulator
- `adb` u PATH

Komande iz root foldera:
- `npm install`
- `npm run start:dapp`
- `npm run start:wallet`
- `npm run android:dapp`
- `npm run android:wallet`

## End-to-End tok

- dApp šalje zahtev wallet-u preko `srn-wallet://`
- wallet prikazuje payload i šalje approve/reject
- wallet vraća odgovor na `srn-dapp://callback`
- dApp validira `state`, mapira `requestId`, i čuva sesiju

## Šta je uključeno

- `CONNECT`, `SIGN`, `EXECUTE_TX` flow
- `requestId`, `state`, `nonce` u svakom zahtevu
- provera `state` na callback-u
- base64 JSON payload kroz query parametar
- AsyncStorage sesija na dApp strani

## Ograničenja

- Mock potpis, nije pravi Starknet potpis
- Nema realne wallet integracije
- Android-only PoC u ovoj verziji

## Dokumentacija

- `/docs/protocol.md`
- `/docs/testing.md`
- `/apps/dapp/README.md`
- `/apps/wallet/README.md`
