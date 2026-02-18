const protocol = require('./src/protocol');
const {
  WalletAdapterProvider,
  useWallet,
  useTransaction,
} = require('./src/wallet-context');

module.exports = {
  ...protocol,
  WalletAdapterProvider,
  useWallet,
  useTransaction,
};
