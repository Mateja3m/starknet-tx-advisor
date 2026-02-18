const base64 = require('base-64');

const WALLET_SCHEME = 'srn-wallet://';

function encodePayload(data) {
  return base64.encode(JSON.stringify(data));
}

function decodePayload(payload) {
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(base64.decode(payload));
  } catch (error) {
    return null;
  }
}

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function parseUrlParams(url) {
  try {
    const parsed = new URL(url);
    return {
      params: parsed.searchParams,
      path: parsed.pathname.replace(/^\//, ''),
    };
  } catch (error) {
    const qIndex = url.indexOf('?');
    const queryString = qIndex >= 0 ? url.slice(qIndex + 1) : '';
    return {
      params: new URLSearchParams(queryString),
      path: '',
    };
  }
}

function buildWalletUrl(path, payload) {
  const encodedPayload = encodePayload(payload);
  return `${WALLET_SCHEME}${path}?payload=${encodeURIComponent(encodedPayload)}`;
}

function buildConnectUrl({ callbackUrl, requestId, state, nonce, appName }) {
  return buildWalletUrl('connect', {
    type: 'CONNECT',
    callbackUrl,
    requestId,
    state,
    nonce,
    appName,
    createdAt: Date.now(),
  });
}

function buildSignMessageUrl({ callbackUrl, requestId, state, nonce, message }) {
  return buildWalletUrl('sign', {
    type: 'SIGN',
    callbackUrl,
    requestId,
    state,
    nonce,
    message,
    createdAt: Date.now(),
  });
}

function buildExecuteTxUrl({ callbackUrl, requestId, state, nonce, tx }) {
  return buildWalletUrl('execute', {
    type: 'EXECUTE_TX',
    callbackUrl,
    requestId,
    state,
    nonce,
    tx,
    createdAt: Date.now(),
  });
}

function parseWalletResponse(url) {
  const { params } = parseUrlParams(url);
  const encodedPayload = params.get('payload');
  const payload = decodePayload(encodedPayload);

  if (payload) {
    return payload;
  }

  return {
    requestId: params.get('requestId'),
    state: params.get('state'),
    nonce: params.get('nonce'),
    type: params.get('type'),
    status: params.get('status'),
    errorCode: params.get('errorCode'),
    errorMessage: params.get('errorMessage'),
  };
}

function validateWalletResponse({ expectedState, response }) {
  if (!response || !response.requestId) {
    return { ok: false, reason: 'MALFORMED_RESPONSE' };
  }

  if (!response.state || response.state !== expectedState) {
    return { ok: false, reason: 'STATE_MISMATCH' };
  }

  return { ok: true };
}

module.exports = {
  randomId,
  encodePayload,
  decodePayload,
  buildConnectUrl,
  buildSignMessageUrl,
  buildExecuteTxUrl,
  parseWalletResponse,
  validateWalletResponse,
};
