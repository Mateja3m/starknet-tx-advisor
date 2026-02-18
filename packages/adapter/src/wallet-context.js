const React = require('react');
const { Linking } = require('react-native');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const {
  randomId,
  buildConnectUrl,
  buildSignMessageUrl,
  buildExecuteTxUrl,
  parseWalletResponse,
  validateWalletResponse,
} = require('./protocol');

const WalletContext = React.createContext(null);
const SESSION_STORAGE_KEY = 'srn.wallet.session';

function WalletAdapterProvider({ children, appName = 'SRN dApp', callbackUrl = 'srn-dapp://callback' }) {
  const [session, setSession] = React.useState(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [lastError, setLastError] = React.useState(null);
  const [lastSignature, setLastSignature] = React.useState(null);
  const [txStatus, setTxStatus] = React.useState('IDLE');
  const [txResult, setTxResult] = React.useState(null);
  const pendingRequestsRef = React.useRef({});

  const persistSession = React.useCallback(async (nextSession) => {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const loadSession = React.useCallback(async () => {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      setSession(JSON.parse(raw));
    }
  }, []);

  const disconnect = React.useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  }, []);

  const clearStorage = React.useCallback(async () => {
    await AsyncStorage.clear();
    setSession(null);
    setLastSignature(null);
    setTxResult(null);
    setTxStatus('IDLE');
  }, []);

  const trackPending = React.useCallback((requestId, data) => {
    pendingRequestsRef.current[requestId] = data;
  }, []);

  const handleCallback = React.useCallback(
    async (url) => {
      if (!url || !url.startsWith('srn-dapp://')) {
        return;
      }

      console.log('[adapter] incoming callback', url);
      const response = parseWalletResponse(url);
      const pending = response.requestId ? pendingRequestsRef.current[response.requestId] : null;

      if (!pending) {
        setLastError('UNKNOWN_REQUEST');
        console.warn('[adapter] unknown request id in callback', response.requestId);
        return;
      }

      if (pending.type === 'CONNECT') {
        setIsConnecting(false);
      }

      const validation = validateWalletResponse({
        expectedState: pending.expectedState,
        response,
      });

      if (!validation.ok) {
        setLastError(validation.reason);
        delete pendingRequestsRef.current[response.requestId];
        return;
      }

      if (response.status === 'REJECTED') {
        setLastError(response.errorCode || 'REQUEST_REJECTED');
        if (pending.type === 'EXECUTE_TX') {
          setTxStatus('REJECTED');
        }
        delete pendingRequestsRef.current[response.requestId];
        return;
      }

      if (pending.type === 'CONNECT') {
        const nextSession = {
          walletAddress: response.data?.walletAddress,
          sessionId: response.data?.sessionId,
          connectedAt: Date.now(),
        };
        await persistSession(nextSession);
      }

      if (pending.type === 'SIGN') {
        setLastSignature(response.data?.signature || null);
      }

      if (pending.type === 'EXECUTE_TX') {
        setTxStatus(response.data?.status || 'WALLET_APPROVED');
        setTxResult(response.data || null);
        setTimeout(() => {
          setTxStatus('CONFIRMED');
        }, 1200);
      }

      setLastError(null);
      delete pendingRequestsRef.current[response.requestId];
    },
    [persistSession]
  );

  React.useEffect(() => {
    loadSession();

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleCallback(url);
    });

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleCallback(initialUrl);
      }
    });

    return () => {
      sub.remove();
    };
  }, [loadSession, handleCallback]);

  const connect = React.useCallback(async () => {
    setIsConnecting(true);
    setLastError(null);

    const requestId = randomId('connect');
    const state = randomId('state');
    const nonce = randomId('nonce');

    trackPending(requestId, {
      expectedState: state,
      type: 'CONNECT',
    });

    const walletUrl = buildConnectUrl({
      callbackUrl,
      requestId,
      state,
      nonce,
      appName,
    });

    console.log('[adapter] connect request', walletUrl);
    try {
      await Linking.openURL(walletUrl);
    } catch (error) {
      setIsConnecting(false);
      setLastError('WALLET_OPEN_FAILED');
      throw error;
    }
  }, [appName, callbackUrl, trackPending]);

  const signMessage = React.useCallback(
    async (message) => {
      const requestId = randomId('sign');
      const state = randomId('state');
      const nonce = randomId('nonce');

      trackPending(requestId, {
        expectedState: state,
        type: 'SIGN',
      });

      const walletUrl = buildSignMessageUrl({
        callbackUrl,
        requestId,
        state,
        nonce,
        message,
      });

      console.log('[adapter] sign request', walletUrl);
      await Linking.openURL(walletUrl);
      return requestId;
    },
    [callbackUrl, trackPending]
  );

  const sendMockTransaction = React.useCallback(
    async (tx) => {
      const requestId = randomId('tx');
      const state = randomId('state');
      const nonce = randomId('nonce');

      setTxStatus('CREATED');
      setTxResult(null);
      setLastError(null);

      trackPending(requestId, {
        expectedState: state,
        type: 'EXECUTE_TX',
      });

      setTxStatus('REQUESTED');

      const walletUrl = buildExecuteTxUrl({
        callbackUrl,
        requestId,
        state,
        nonce,
        tx,
      });

      console.log('[adapter] execute request', walletUrl);
      await Linking.openURL(walletUrl);
      return requestId;
    },
    [callbackUrl, trackPending]
  );

  const value = React.useMemo(
    () => ({
      session,
      isConnecting,
      isConnected: Boolean(session),
      connect,
      disconnect,
      clearStorage,
      signMessage,
      sendMockTransaction,
      lastError,
      lastSignature,
      txStatus,
      txResult,
      resetTransaction: () => {
        setTxStatus('IDLE');
        setTxResult(null);
      },
    }),
    [
      session,
      isConnecting,
      connect,
      disconnect,
      clearStorage,
      signMessage,
      sendMockTransaction,
      lastError,
      lastSignature,
      txStatus,
      txResult,
    ]
  );

  return React.createElement(WalletContext.Provider, { value }, children);
}

function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside WalletAdapterProvider');
  }

  return {
    session: context.session,
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    connect: context.connect,
    disconnect: context.disconnect,
    clearStorage: context.clearStorage,
    signMessage: context.signMessage,
    lastSignature: context.lastSignature,
    lastError: context.lastError,
  };
}

function useTransaction() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useTransaction must be used inside WalletAdapterProvider');
  }

  return {
    status: context.txStatus,
    txResult: context.txResult,
    sendMockTransaction: context.sendMockTransaction,
    reset: context.resetTransaction,
    lastError: context.lastError,
  };
}

module.exports = {
  WalletAdapterProvider,
  useWallet,
  useTransaction,
};
