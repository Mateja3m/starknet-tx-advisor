import React from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Linking } from 'react-native';
import base64 from 'base-64';
import CryptoJS from 'crypto-js';

const SIGNING_SECRET = 'srn-mock-secret';

function randomValue(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function decodeRequest(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const route = parsed.pathname.replace(/^\//, '');
    const payload = parsed.searchParams.get('payload');

    if (!payload) {
      return null;
    }

    const request = JSON.parse(base64.decode(payload));
    return { route, request, rawUrl: url };
  } catch (error) {
    console.warn('[wallet] failed to decode request', error);
    return null;
  }
}

function makeMockSignature(input) {
  const hash = CryptoJS.SHA256(`${input}${SIGNING_SECRET}`);
  return CryptoJS.enc.Base64.stringify(hash);
}

function buildCallbackUrl(callbackUrl, response) {
  const encodedPayload = base64.encode(JSON.stringify(response));
  const separator = callbackUrl.includes('?') ? '&' : '?';
  return `${callbackUrl}${separator}payload=${encodeURIComponent(encodedPayload)}`;
}

function buildApprovedResponse(request) {
  const baseResponse = {
    requestId: request.requestId,
    state: request.state,
    nonce: request.nonce,
    type: request.type,
    status: 'APPROVED',
    timestamp: Date.now(),
    data: {},
  };

  if (request.type === 'CONNECT') {
    return {
      ...baseResponse,
      data: {
        walletAddress: `0xMOCK${Math.floor(Math.random() * 1e10).toString(16)}`,
        sessionId: randomValue('session'),
      },
    };
  }

  if (request.type === 'SIGN') {
    const payloadToSign = JSON.stringify({
      message: request.message,
      requestId: request.requestId,
      nonce: request.nonce,
    });

    return {
      ...baseResponse,
      data: {
        signature: makeMockSignature(payloadToSign),
      },
    };
  }

  if (request.type === 'EXECUTE_TX') {
    return {
      ...baseResponse,
      data: {
        txHash: `0xMOCKTX${Math.floor(Math.random() * 1e12).toString(16)}`,
        status: 'WALLET_APPROVED',
      },
    };
  }

  return {
    ...baseResponse,
    status: 'REJECTED',
    errorCode: 'UNSUPPORTED_TYPE',
    errorMessage: `Unsupported request type ${request.type}`,
  };
}

function buildRejectedResponse(request) {
  return {
    requestId: request.requestId,
    state: request.state,
    nonce: request.nonce,
    type: request.type,
    status: 'REJECTED',
    timestamp: Date.now(),
    errorCode: 'USER_REJECTED',
    errorMessage: 'User rejected request in mock wallet',
  };
}

export default function App() {
  const [incoming, setIncoming] = React.useState(null);
  const [lastCallbackUrl, setLastCallbackUrl] = React.useState('-');

  const processUrl = React.useCallback((url) => {
    if (!url || !url.startsWith('srn-wallet://')) {
      return;
    }
    console.log('[wallet] incoming deep link', url);
    const decoded = decodeRequest(url);
    setIncoming(decoded);
  }, []);

  React.useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        processUrl(initialUrl);
      }
    });

    return () => {
      sub.remove();
    };
  }, [processUrl]);

  const sendResponse = async (responseBuilder) => {
    if (!incoming?.request?.callbackUrl) {
      return;
    }

    const response = responseBuilder(incoming.request);
    const callbackUrl = buildCallbackUrl(incoming.request.callbackUrl, response);
    setLastCallbackUrl(callbackUrl);
    console.log('[wallet] callback url', callbackUrl);
    await Linking.openURL(callbackUrl);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollArea}>
        <Text style={styles.title}>SRN Mock Wallet</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Request Type</Text>
          <Text style={styles.value}>{incoming?.request?.type || '-'}</Text>

          <Text style={styles.label}>Route</Text>
          <Text style={styles.value}>{incoming?.route || '-'}</Text>

          <Text style={styles.label}>Payload</Text>
          <Text style={styles.payload}>{incoming?.request ? JSON.stringify(incoming.request, null, 2) : '-'}</Text>
        </View>

        <View style={styles.row}>
          <Pressable style={styles.approveBtn} onPress={() => sendResponse(buildApprovedResponse)}>
            <Text style={styles.btnText}>Approve</Text>
          </Pressable>
          <Pressable style={styles.rejectBtn} onPress={() => sendResponse(buildRejectedResponse)}>
            <Text style={styles.btnText}>Reject</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Last callback URL</Text>
          <Text style={styles.payload}>{lastCallbackUrl}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101513',
  },
  scrollArea: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#18231e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  label: {
    color: '#8cb3a0',
    marginTop: 8,
    fontSize: 13,
  },
  value: {
    color: '#ffffff',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  payload: {
    color: '#d6f4e5',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#1f8f56',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#8f2d2d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
