const React = require('react');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const Linking = require('expo-linking');
const {
  randomId,
  randomString,
  buildConnectUrl,
  buildExecuteTxUrl,
  buildSignUrl,
  parseWalletResponse,
  validateWalletResponse,
} = require('@smdak/adapter');

const WalletContext = React.createContext(null);

const STORAGE_KEYS = {
  session: 'smdak.session',
  logs: 'smdak.logs',
  history: 'smdak.tx.history',
};

function nowIso() {
  return new Date().toISOString();
}

function SmdakProvider({ children, callbackUrl = 'smdak-dapp://callback', appName = 'SMDAK Starter dApp' }) {
  const pendingRequestsRef = React.useRef({});
  const [status, setStatus] = React.useState('DISCONNECTED');
  const [session, setSession] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [txState, setTxState] = React.useState({ status: 'IDLE', txHash: null, requestId: null, kind: null });
  const [logs, setLogs] = React.useState([]);
  const [history, setHistory] = React.useState([]);

  const appendLog = React.useCallback(async (event, data) => {
    const entry = {
      id: randomId('log'),
      at: nowIso(),
      event,
      data: data || null,
    };

    setLogs((prev) => {
      const next = [entry, ...prev].slice(0, 200);
      AsyncStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(next));
      return next;
    });
  }, []);

  const persistSession = React.useCallback(async (nextSession) => {
    await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const persistHistory = React.useCallback(async (next) => {
    await AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
    setHistory(next);
  }, []);

  const loadPersisted = React.useCallback(async () => {
    const [rawSession, rawLogs, rawHistory] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.session),
      AsyncStorage.getItem(STORAGE_KEYS.logs),
      AsyncStorage.getItem(STORAGE_KEYS.history),
    ]);

    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      setSession(parsed);
      setStatus('CONNECTED');
    }

    if (rawLogs) {
      setLogs(JSON.parse(rawLogs));
    }

    if (rawHistory) {
      setHistory(JSON.parse(rawHistory));
    }
  }, []);

  const finalizeConfirmed = React.useCallback(
    async (pending, response) => {
      const confirmationDelayMs = 2000 + Math.floor(Math.random() * 2000);
      setTimeout(async () => {
        setTxState((prev) => ({ ...prev, status: 'CONFIRMED' }));
        const item = {
          id: randomId('txh'),
          requestId: response.requestId,
          kind: pending.kind,
          txHash: response.result && response.result.txHash,
          requestPayload: pending.payload,
          confirmedAt: nowIso(),
          status: 'CONFIRMED',
        };

        const nextHistory = [item, ...history].slice(0, 200);
        await persistHistory(nextHistory);
        await appendLog('TX_CONFIRMED', item);
      }, confirmationDelayMs);
    },
    [history, persistHistory, appendLog]
  );

  const handleIncomingCallback = React.useCallback(
    async (url) => {
      if (!url || !url.startsWith('smdak-dapp://')) {
        return;
      }

      console.log('[smdak-hooks] callback', url);
      const response = parseWalletResponse(url);
      if (!response || !response.requestId) {
        setError('MALFORMED_RESPONSE');
        await appendLog('CALLBACK_MALFORMED', { url });
        return;
      }

      const pending = pendingRequestsRef.current[response.requestId];
      const validation = validateWalletResponse({ pending, response });
      if (!validation.ok) {
        setError(validation.reason);
        await appendLog('CALLBACK_REJECTED_BY_VALIDATION', {
          reason: validation.reason,
          response,
        });
        delete pendingRequestsRef.current[response.requestId];
        return;
      }

      await appendLog('CALLBACK_RECEIVED', response);

      if (response.status === 'REJECTED') {
        setError(response.errorCode || 'REQUEST_REJECTED');
        if (pending.type === 'EXECUTE_TX') {
          setTxState((prev) => ({ ...prev, status: 'REJECTED' }));
        }
        delete pendingRequestsRef.current[response.requestId];
        return;
      }

      if (response.status === 'ERROR') {
        setError(response.errorCode || 'WALLET_ERROR');
        if (pending.type === 'EXECUTE_TX') {
          setTxState((prev) => ({ ...prev, status: 'ERROR' }));
        }
        delete pendingRequestsRef.current[response.requestId];
        return;
      }

      if (pending.type === 'CONNECT') {
        const nextSession = {
          walletAddress: response.result && response.result.walletAddress,
          sessionId: response.result && response.result.sessionId,
          chain: response.result && response.result.chain,
          connectedAt: nowIso(),
        };
        await persistSession(nextSession);
        setStatus('CONNECTED');
        setError(null);
        await appendLog('CONNECTED', nextSession);
      }

      if (pending.type === 'SIGN') {
        await appendLog('SIGNED_MESSAGE', {
          requestId: response.requestId,
          signature: response.result && response.result.signature,
        });
      }

      if (pending.type === 'EXECUTE_TX') {
        setTxState({
          status: (response.result && response.result.status) || 'WALLET_APPROVED',
          txHash: response.result && response.result.txHash,
          requestId: response.requestId,
          kind: pending.kind,
        });
        setError(null);
        await appendLog('TX_WALLET_APPROVED', {
          requestId: response.requestId,
          txHash: response.result && response.result.txHash,
          kind: pending.kind,
        });
        await finalizeConfirmed(pending, response);
      }

      delete pendingRequestsRef.current[response.requestId];
    },
    [appendLog, finalizeConfirmed, persistSession]
  );

  React.useEffect(() => {
    loadPersisted();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingCallback(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleIncomingCallback(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadPersisted, handleIncomingCallback]);

  const connect = React.useCallback(async () => {
    setStatus('CONNECTING');
    setError(null);

    const requestId = randomId('connect');
    const state = randomString(24);
    const nonce = randomString(24);
    const requestPayload = { appName };

    pendingRequestsRef.current[requestId] = {
      type: 'CONNECT',
      state,
      nonce,
      createdAt: nowIso(),
      payload: requestPayload,
      kind: 'CONNECT',
    };

    const url = buildConnectUrl({
      callbackUrl,
      requestId,
      state,
      nonce,
      payload: requestPayload,
    });

    await appendLog('CONNECT_REQUESTED', { requestId, state, nonce });
    console.log('[smdak-hooks] open wallet connect', url);

    try {
      await Linking.openURL(url);
    } catch (err) {
      setStatus('DISCONNECTED');
      setError('WALLET_OPEN_FAILED');
      await appendLog('CONNECT_FAILED_TO_OPEN_WALLET', { message: String(err) });
    }
  }, [appName, callbackUrl, appendLog]);

  const disconnect = React.useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.session);
    setSession(null);
    setStatus('DISCONNECTED');
    setError(null);
    await appendLog('DISCONNECTED', null);
  }, [appendLog]);

  const sendTx = React.useCallback(
    async (payload, options) => {
      const requestId = randomId('tx');
      const state = randomString(24);
      const nonce = randomString(24);
      const kind = (options && options.kind) || 'EXECUTE_TX';

      setTxState({
        status: 'CREATED',
        txHash: null,
        requestId,
        kind,
      });
      setError(null);

      pendingRequestsRef.current[requestId] = {
        type: 'EXECUTE_TX',
        state,
        nonce,
        createdAt: nowIso(),
        payload,
        kind,
      };

      const url = buildExecuteTxUrl({
        callbackUrl,
        requestId,
        state,
        nonce,
        payload,
      });

      setTxState({
        status: 'REQUESTED',
        txHash: null,
        requestId,
        kind,
      });
      await appendLog('TX_REQUESTED', { requestId, kind, payload });
      console.log('[smdak-hooks] open wallet execute', url);

      try {
        await Linking.openURL(url);
      } catch (err) {
        setTxState((prev) => ({ ...prev, status: 'ERROR' }));
        setError('WALLET_OPEN_FAILED');
        await appendLog('TX_FAILED_TO_OPEN_WALLET', { requestId, message: String(err) });
      }
    },
    [callbackUrl, appendLog]
  );

  const signMessage = React.useCallback(
    async (message) => {
      const requestId = randomId('sign');
      const state = randomString(24);
      const nonce = randomString(24);
      const payload = { message };

      pendingRequestsRef.current[requestId] = {
        type: 'SIGN',
        state,
        nonce,
        createdAt: nowIso(),
        payload,
        kind: 'SIGN',
      };

      const url = buildSignUrl({
        callbackUrl,
        requestId,
        state,
        nonce,
        payload,
      });

      await appendLog('SIGN_REQUESTED', { requestId, message });
      console.log('[smdak-hooks] open wallet sign', url);
      await Linking.openURL(url);
      return requestId;
    },
    [callbackUrl, appendLog]
  );

  const clearStorage = React.useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.session),
      AsyncStorage.removeItem(STORAGE_KEYS.logs),
      AsyncStorage.removeItem(STORAGE_KEYS.history),
    ]);

    pendingRequestsRef.current = {};
    setSession(null);
    setStatus('DISCONNECTED');
    setLogs([]);
    setHistory([]);
    setTxState({ status: 'IDLE', txHash: null, requestId: null, kind: null });
    setError(null);
  }, []);

  const clearLogs = React.useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.logs),
      AsyncStorage.removeItem(STORAGE_KEYS.history),
    ]);
    setLogs([]);
    setHistory([]);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      status,
      session,
      error,
      txState,
      logs,
      history,
      connect,
      disconnect,
      sendTx,
      signMessage,
      clearStorage,
      clearLogs,
    }),
    [status, session, error, txState, logs, history, connect, disconnect, sendTx, signMessage, clearStorage, clearLogs]
  );

  return React.createElement(WalletContext.Provider, { value: contextValue }, children);
}

function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside SmdakProvider');
  }

  return {
    status: context.status,
    session: context.session,
    connect: context.connect,
    disconnect: context.disconnect,
    clearStorage: context.clearStorage,
    error: context.error,
  };
}

function useTransaction() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useTransaction must be used inside SmdakProvider');
  }

  return {
    sendTx: context.sendTx,
    txState: context.txState,
    error: context.error,
  };
}

function useActivity() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useActivity must be used inside SmdakProvider');
  }

  return {
    logs: context.logs,
    history: context.history,
    clearLogs: context.clearLogs,
  };
}

module.exports = {
  SmdakProvider,
  useWallet,
  useTransaction,
  useActivity,
};
