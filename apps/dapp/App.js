import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SmdakProvider, useWallet, useTransaction, useActivity } from '@smdak/hooks';

function Tab({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={styles.tabText}>{label}</Text>
    </Pressable>
  );
}

function HomeScreen() {
  const { status, session, connect, disconnect, error } = useWallet();

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>Home</Text>
      <Text style={styles.k}>Wallet Status</Text>
      <Text style={styles.v}>{status}</Text>

      <View style={styles.row}>
        <Pressable style={styles.primaryBtn} onPress={connect}>
          <Text style={styles.btnText}>Connect</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={disconnect}>
          <Text style={styles.btnText}>Disconnect</Text>
        </Pressable>
      </View>

      <Text style={styles.k}>Session</Text>
      <Text style={styles.v}>walletAddress: {session?.walletAddress || '-'}</Text>
      <Text style={styles.v}>sessionId: {session?.sessionId || '-'}</Text>
      <Text style={styles.v}>chain: {session?.chain || '-'}</Text>
      <Text style={styles.v}>connectedAt: {session?.connectedAt || '-'}</Text>

      <Text style={styles.k}>Last Error</Text>
      <Text style={styles.v}>{error || '-'}</Text>
    </View>
  );
}

function DefiScreen() {
  const { sendTx, txState, error } = useTransaction();
  const [fromToken, setFromToken] = React.useState('ETH');
  const [toToken, setToToken] = React.useState('STRK');
  const [amount, setAmount] = React.useState('1.0');
  const [quote, setQuote] = React.useState(null);

  const getQuote = () => {
    const numericAmount = Number(amount || 0);
    const rate = 12.45;
    const outAmount = (numericAmount * rate).toFixed(4);
    const q = {
      fromToken,
      toToken,
      inAmount: amount,
      outAmount,
      rate,
      slippageBps: 50,
      generatedAt: new Date().toISOString(),
    };
    setQuote(q);
  };

  const executeSwap = () => {
    if (!quote) {
      return;
    }
    sendTx(
      {
        action: 'SWAP',
        quote,
      },
      { kind: 'SWAP' }
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>DeFi Demo - Mock Swap</Text>
      <TextInput style={styles.input} value={fromToken} onChangeText={setFromToken} placeholder="fromToken" />
      <TextInput style={styles.input} value={toToken} onChangeText={setToToken} placeholder="toToken" />
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="amount" keyboardType="numeric" />

      <View style={styles.row}>
        <Pressable style={styles.primaryBtn} onPress={getQuote}>
          <Text style={styles.btnText}>Get Quote</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={executeSwap}>
          <Text style={styles.btnText}>Execute Swap</Text>
        </Pressable>
      </View>

      <Text style={styles.k}>Quote</Text>
      <Text style={styles.v}>{quote ? JSON.stringify(quote, null, 2) : '-'}</Text>

      <Text style={styles.k}>Lifecycle</Text>
      <Text style={styles.v}>CREATED - REQUESTED - WALLET_APPROVED - CONFIRMED</Text>
      <Text style={styles.v}>Current: {txState.status}</Text>
      <Text style={styles.v}>txHash: {txState.txHash || '-'}</Text>
      <Text style={styles.v}>error: {error || '-'}</Text>
    </View>
  );
}

function NftScreen() {
  const { sendTx, txState, error } = useTransaction();
  const [collectionName, setCollectionName] = React.useState('SMDAK Collection');
  const [receiver, setReceiver] = React.useState('0xMOCK_RECEIVER');

  const mint = () => {
    sendTx(
      {
        action: 'MINT_NFT',
        collectionName,
        receiver,
      },
      { kind: 'MINT' }
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>NFT Demo - Mock Mint</Text>
      <TextInput
        style={styles.input}
        value={collectionName}
        onChangeText={setCollectionName}
        placeholder="collectionName"
      />
      <TextInput style={styles.input} value={receiver} onChangeText={setReceiver} placeholder="receiver" />
      <Pressable style={styles.primaryBtn} onPress={mint}>
        <Text style={styles.btnText}>Mint NFT</Text>
      </Pressable>

      <Text style={styles.k}>Lifecycle</Text>
      <Text style={styles.v}>CREATED - REQUESTED - WALLET_APPROVED - CONFIRMED</Text>
      <Text style={styles.v}>Current: {txState.status}</Text>
      <Text style={styles.v}>txHash: {txState.txHash || '-'}</Text>
      <Text style={styles.v}>error: {error || '-'}</Text>
    </View>
  );
}

function ActivityScreen() {
  const { logs, history, clearLogs } = useActivity();

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>Activity / Logs</Text>
      <Pressable style={styles.secondaryBtn} onPress={clearLogs}>
        <Text style={styles.btnText}>Clear Logs</Text>
      </Pressable>

      <Text style={styles.k}>Recent Transactions</Text>
      <Text style={styles.v}>{history.length ? JSON.stringify(history, null, 2) : 'No history yet.'}</Text>

      <Text style={styles.k}>Recent Logs</Text>
      <Text style={styles.v}>{logs.length ? JSON.stringify(logs.slice(0, 20), null, 2) : 'No logs yet.'}</Text>
    </View>
  );
}

function SettingsScreen() {
  const { clearStorage } = useWallet();

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>Settings</Text>
      <Pressable style={styles.secondaryBtn} onPress={clearStorage}>
        <Text style={styles.btnText}>Clear Storage</Text>
      </Pressable>
    </View>
  );
}

function Shell() {
  const [tab, setTab] = React.useState('home');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        horizontal
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
        showsHorizontalScrollIndicator={false}
      >
        <Tab active={tab === 'home'} label="Home" onPress={() => setTab('home')} />
        <Tab active={tab === 'defi'} label="DeFi" onPress={() => setTab('defi')} />
        <Tab active={tab === 'nft'} label="NFT" onPress={() => setTab('nft')} />
        <Tab active={tab === 'logs'} label="Logs" onPress={() => setTab('logs')} />
        <Tab active={tab === 'settings'} label="Settings" onPress={() => setTab('settings')} />
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'defi' && <DefiScreen />}
        {tab === 'nft' && <NftScreen />}
        {tab === 'logs' && <ActivityScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SmdakProvider callbackUrl="smdak-dapp://callback" appName="SMDAK Starter dApp">
      <Shell />
    </SmdakProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1526',
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 6 : 0,
  },
  scroll: { padding: 12 },
  tabsScroll: {
    maxHeight: 58,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  tab: {
    backgroundColor: '#1f2a45',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: '#2f5be4' },
  tabText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#131d35',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  h1: { color: '#fff', fontWeight: '700', fontSize: 19, marginBottom: 10 },
  k: { color: '#8ca1db', marginTop: 8 },
  v: { color: '#fff', marginTop: 4, fontFamily: 'monospace' },
  input: {
    borderWidth: 1,
    borderColor: '#2f416f',
    borderRadius: 8,
    color: '#fff',
    backgroundColor: '#0d172f',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#2f5be4',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#34436b',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
