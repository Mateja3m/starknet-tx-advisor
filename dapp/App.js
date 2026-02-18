import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { WalletAdapterProvider, useWallet, useTransaction } from '@srn/adapter';

function TabButton({ label, active, onPress }) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabActive]} onPress={onPress}>
      <Text style={styles.tabText}>{label}</Text>
    </Pressable>
  );
}

function HomeScreen() {
  const { connect, isConnected, isConnecting, session, lastError } = useWallet();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Home</Text>
      <Pressable style={styles.primaryButton} onPress={connect} disabled={isConnecting}>
        <Text style={styles.primaryButtonText}>{isConnecting ? 'Opening Wallet...' : 'Connect Wallet'}</Text>
      </Pressable>

      <Text style={styles.label}>Connection State</Text>
      <Text style={styles.value}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</Text>

      <Text style={styles.label}>Session</Text>
      <Text style={styles.value}>walletAddress: {session?.walletAddress || '-'}</Text>
      <Text style={styles.value}>
        connectedAt: {session?.connectedAt ? new Date(session.connectedAt).toISOString() : '-'}
      </Text>

      <Text style={styles.label}>Last Error</Text>
      <Text style={styles.value}>{lastError || '-'}</Text>
    </View>
  );
}

function SignMessageScreen() {
  const { signMessage, lastSignature, lastError } = useWallet();
  const [message, setMessage] = React.useState('hello starknet');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sign Message</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Message to sign"
        style={styles.input}
      />
      <Pressable style={styles.primaryButton} onPress={() => signMessage(message)}>
        <Text style={styles.primaryButtonText}>Sign</Text>
      </Pressable>

      <Text style={styles.label}>Signature</Text>
      <Text style={styles.value}>{lastSignature || '-'}</Text>

      <Text style={styles.label}>Last Error</Text>
      <Text style={styles.value}>{lastError || '-'}</Text>
    </View>
  );
}

function MockTransactionScreen() {
  const { status, txResult, sendMockTransaction, lastError } = useTransaction();

  const onSend = () => {
    sendMockTransaction({
      to: '0xMOCKRECIPIENT',
      amount: '0.01',
      token: 'ETH',
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mock Transaction</Text>
      <Pressable style={styles.primaryButton} onPress={onSend}>
        <Text style={styles.primaryButtonText}>Send Mock Tx</Text>
      </Pressable>

      <Text style={styles.label}>Lifecycle</Text>
      <Text style={styles.value}>CREATED - REQUESTED - WALLET_APPROVED - CONFIRMED</Text>
      <Text style={styles.value}>Current: {status}</Text>

      <Text style={styles.label}>Tx Result</Text>
      <Text style={styles.value}>{txResult ? JSON.stringify(txResult, null, 2) : '-'}</Text>

      <Text style={styles.label}>Last Error</Text>
      <Text style={styles.value}>{lastError || '-'}</Text>
    </View>
  );
}

function SettingsScreen() {
  const { disconnect, clearStorage } = useWallet();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Settings</Text>
      <Pressable style={styles.secondaryButton} onPress={disconnect}>
        <Text style={styles.secondaryButtonText}>Disconnect</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={clearStorage}>
        <Text style={styles.secondaryButtonText}>Clear Storage</Text>
      </Pressable>
    </View>
  );
}

function DappShell() {
  const [tab, setTab] = React.useState('home');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <TabButton label="Home" active={tab === 'home'} onPress={() => setTab('home')} />
        <TabButton label="Sign" active={tab === 'sign'} onPress={() => setTab('sign')} />
        <TabButton label="Tx" active={tab === 'tx'} onPress={() => setTab('tx')} />
        <TabButton label="Settings" active={tab === 'settings'} onPress={() => setTab('settings')} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'sign' && <SignMessageScreen />}
        {tab === 'tx' && <MockTransactionScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <WalletAdapterProvider callbackUrl="srn-dapp://callback" appName="SRN PoC dApp">
      <DappShell />
    </WalletAdapterProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1f',
  },
  scrollArea: {
    padding: 16,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1d2742',
  },
  tabActive: {
    backgroundColor: '#3157de',
  },
  tabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#121932',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    marginBottom: 12,
    fontWeight: '700',
  },
  label: {
    marginTop: 10,
    color: '#7b8cc8',
    fontSize: 13,
  },
  value: {
    color: '#ffffff',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#35457a',
    borderRadius: 8,
    backgroundColor: '#0f1733',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#3157de',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#212d57',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
