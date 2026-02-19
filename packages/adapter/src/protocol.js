const base64 = require('base-64');

const WALLET_SCHEME = 'smdak-wallet://';
const DAPP_SCHEME = 'smdak-dapp://';

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function encodeBase64Json(value) {
  return base64.encode(JSON.stringify(value));
}

function decodeBase64Json(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(base64.decode(value));
  } catch (error) {
    return null;
  }
}

function parseUrl(url) {
  try {
    const parsed = new URL(url);
    const route = parsed.host || parsed.pathname.replace(/^\//, '');
    return {
      route,
      params: parsed.searchParams,
    };
  } catch (error) {
    const [head, query = ''] = String(url).split('?');
    const route = String(head).split('://')[1] || '';
    return {
      route,
      params: new URLSearchParams(query),
    };
  }
}

function buildWalletUrl(route, request) {
  const encoded = encodeBase64Json(request);
  return `${WALLET_SCHEME}${route}?payload=${encodeURIComponent(encoded)}`;
}

function buildConnectUrl({ callbackUrl, requestId, state, nonce, payload }) {
  return buildWalletUrl('connect', {
    type: 'CONNECT',
    requestId,
    state,
    nonce,
    callbackUrl,
    payload,
    createdAt: Date.now(),
  });
}

function buildSignUrl({ callbackUrl, requestId, state, nonce, payload }) {
  return buildWalletUrl('sign', {
    type: 'SIGN',
    requestId,
    state,
    nonce,
    callbackUrl,
    payload,
    createdAt: Date.now(),
  });
}

function buildExecuteTxUrl({ callbackUrl, requestId, state, nonce, payload }) {
  return buildWalletUrl('execute', {
    type: 'EXECUTE_TX',
    requestId,
    state,
    nonce,
    callbackUrl,
    payload,
    createdAt: Date.now(),
  });
}

function parseWalletRequest(url) {
  if (!url || !url.startsWith(WALLET_SCHEME)) {
    return null;
  }

  const { route, params } = parseUrl(url);
  const payload = decodeBase64Json(params.get('payload'));
  if (!payload) {
    return null;
  }

  return {
    route,
    request: payload,
    rawUrl: url,
  };
}

function buildWalletResponse({ request, status, result, errorCode, errorMessage }) {
  return {
    requestId: request.requestId,
    state: request.state,
    nonce: request.nonce,
    type: request.type,
    status,
    result: result || null,
    errorCode: errorCode || null,
    errorMessage: errorMessage || null,
    respondedAt: Date.now(),
  };
}

function buildCallbackUrl({ callbackUrl, response }) {
  const encoded = encodeBase64Json(response);
  const separator = callbackUrl.includes('?') ? '&' : '?';
  return `${callbackUrl}${separator}payload=${encodeURIComponent(encoded)}`;
}

function parseWalletResponse(url) {
  if (!url || !url.startsWith(DAPP_SCHEME)) {
    return null;
  }

  const { params } = parseUrl(url);
  return decodeBase64Json(params.get('payload'));
}

function validateWalletResponse({ pending, response }) {
  if (!response || !response.requestId || !response.state || !response.nonce) {
    return { ok: false, reason: 'MALFORMED_RESPONSE' };
  }

  if (!pending) {
    return { ok: false, reason: 'UNKNOWN_REQUEST' };
  }

  if (pending.state !== response.state) {
    return { ok: false, reason: 'STATE_MISMATCH' };
  }

  if (pending.nonce !== response.nonce) {
    return { ok: false, reason: 'NONCE_MISMATCH' };
  }

  return { ok: true };
}

module.exports = {
  WALLET_SCHEME,
  DAPP_SCHEME,
  randomId,
  randomString,
  encodeBase64Json,
  decodeBase64Json,
  buildConnectUrl,
  buildSignUrl,
  buildExecuteTxUrl,
  parseWalletRequest,
  buildWalletResponse,
  buildCallbackUrl,
  parseWalletResponse,
  validateWalletResponse,
};
