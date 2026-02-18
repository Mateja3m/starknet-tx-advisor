# dApp App

Expo React Native dApp koja koristi `@srn/adapter` za connect, sign i execute tokove.

## Komande

Pokretanje iz root foldera:
- `npm install`
- `npm run start:dapp`
- `npm run android:dapp`

## Deep link callback

- `srn-dapp://callback`

## Napomena

- Aplikacija validira `state` pre prihvatanja wallet odgovora.
- Sesija se čuva u AsyncStorage.
