import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import CryptoJS from 'crypto-js';
import {
  parseWalletRequest,
  buildWalletResponse,
  buildCallbackUrl,
  randomId,
  encodeBase64Json,
} from '@smdak/adapter';

const SIGN_SECRET = 'smdak-mock-secret';

function makeSignature(message) {
  const hash = CryptoJS.SHA256(`${message}${SIGN_SECRET}`);
  return CryptoJS.enc.Base64.stringify(hash);
}

function buildApprovedResult(request) {
  if (request.type === 'CONNECT') {
    return {
      walletAddress: `0xMOCK${Math.floor(Math.random() * 1e12).toString(16)}`,
      sessionId: randomId('session'),
      chain: 'starknet',
    };
  }

  if (request.type === 'SIGN') {
    return {
      signature: makeSignature((request.payload && request.payload.message) || ''),
    };
  }

  if (request.type === 'EXECUTE_TX') {
    return {
      txHash: `0xMOCKTX${Math.floor(Math.random() * 1e15).toString(16)}`,
      status: 'WALLET_APPROVED',
    };
  }

  return null;
}

export default function App() {
  const [incoming, setIncoming] = React.useState(null);
  const [lastResponseUrl, setLastResponseUrl] = React.useState('');
  const [actionStatus, setActionStatus] = React.useState('IDLE');
  const [lastError, setLastError] = React.useState('');

  const receive = React.useCallback((url) => {
    if (!url || !url.startsWith('smdak-wallet://')) {
      return;
    }

    console.log('[smdak-wallet] incoming url', url);
    const parsed = parseWalletRequest(url);
    setIncoming(parsed);
  }, []);

  React.useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => receive(url));
    Linking.getInitialURL().then((url) => {
      if (url) {
        receive(url);
      }
    });
    return () => sub.remove();
  }, [receive]);

  const sendResponse = async (response) => {
    if (!incoming || !incoming.request || !incoming.request.callbackUrl) {
      setLastError('Missing callbackUrl in incoming request');
      setActionStatus('FAILED');
      return;
    }

    const callbackUrl = buildCallbackUrl({
      callbackUrl: incoming.request.callbackUrl,
      response,
    });

    setLastResponseUrl(callbackUrl);
    console.log('[smdak-wallet] callback', callbackUrl);
    try {
      await Linking.openURL(callbackUrl);
      setActionStatus('SENT');
      setLastError('');
    } catch (error) {
      setLastError(String(error));
      setActionStatus('FAILED');
    }
  };

  const approve = async () => {
    if (!incoming || !incoming.request) {
      setLastError('No incoming request to approve');
      setActionStatus('FAILED');
      return;
    }
    setActionStatus('APPROVING');

    const result = buildApprovedResult(incoming.request);
    if (!result) {
      const response = buildWalletResponse({
        request: incoming.request,
        status: 'ERROR',
        errorCode: 'UNSUPPORTED_TYPE',
        errorMessage: 'Unsupported request type',
      });
      await sendResponse(response);
      return;
    }

    const response = buildWalletResponse({
      request: incoming.request,
      status: 'APPROVED',
      result,
    });

    await sendResponse(response);
  };

  const reject = async () => {
    if (!incoming || !incoming.request) {
      setLastError('No incoming request to reject');
      setActionStatus('FAILED');
      return;
    }
    setActionStatus('REJECTING');

    const response = buildWalletResponse({
      request: incoming.request,
      status: 'REJECTED',
      errorCode: 'USER_REJECTED',
      errorMessage: 'Request rejected by user in mock wallet',
    });

    await sendResponse(response);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>SMDAK Mock Wallet</Text>

        <View style={styles.card}>
          <Text style={styles.k}>Request Type</Text>
          <Text style={styles.v}>{incoming?.request?.type || '-'}</Text>

          <Text style={styles.k}>Route</Text>
          <Text style={styles.v}>{incoming?.route || '-'}</Text>

          <Text style={styles.k}>Request ID</Text>
          <Text style={styles.v}>{incoming?.request?.requestId || '-'}</Text>

          <Text style={styles.k}>Callback URL</Text>
          <Text style={styles.v}>{incoming?.request?.callbackUrl || '-'}</Text>

          <Text style={styles.k}>Decoded Payload</Text>
          <Text style={styles.v}>{incoming?.request ? JSON.stringify(incoming.request, null, 2) : '-'}</Text>

          <Text style={styles.k}>Encoded Payload Preview</Text>
          <Text style={styles.v}>{incoming?.request ? encodeBase64Json(incoming.request) : '-'}</Text>
        </View>

        <View style={styles.row}>
          <Pressable onPress={approve} style={({ pressed }) => [styles.approveBtn, pressed && styles.buttonPressed]}>
            <Text style={styles.btnText}>Approve</Text>
          </Pressable>
          <Pressable onPress={reject} style={({ pressed }) => [styles.rejectBtn, pressed && styles.buttonPressed]}>
            <Text style={styles.btnText}>Reject</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.k}>Action Status</Text>
          <Text style={styles.v}>{actionStatus}</Text>

          <Text style={styles.k}>Last Error</Text>
          <Text style={styles.v}>{lastError || '-'}</Text>

          <Text style={styles.k}>Last Callback URL</Text>
          <Text style={styles.v}>{lastResponseUrl || '-'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121714' },
  scroll: { padding: 14 },
  h1: { color: '#fff', fontSize: 23, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: '#18221c',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  k: { color: '#98b7a2', marginTop: 6 },
  v: { color: '#fff', marginTop: 4, fontFamily: 'monospace' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#228048',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#8b2d2d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
