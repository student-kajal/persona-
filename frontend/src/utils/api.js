import axios from 'axios';

// ── In-memory access token (XSS-safe – never written to localStorage) ─────────
let _accessToken  = null;
let _refreshTimer = null;

// ── Cross-tab token sync via BroadcastChannel ─────────────────────────────────
// When one tab refreshes successfully it broadcasts the new token so all other
// tabs receive it immediately. This prevents multiple tabs from all calling
// /auth/refresh simultaneously (which would cause token-rotation revocations).
const _channel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('gpfax_auth')
  : null;

if (_channel) {
  _channel.onmessage = (event) => {
    if (event.data?.type === 'TOKEN_REFRESH' && event.data.token) {
      // Silently adopt the new token — no outbound refresh needed from this tab
      _accessToken = event.data.token;
      scheduleProactiveRefresh(event.data.token);
    }
    if (event.data?.type === 'SESSION_EXPIRED') {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  };
}

// ── Proactive refresh scheduler ────────────────────────────────────────────────
// Decodes the JWT exp claim and fires a silent refresh 60 s before expiry.
// Random jitter (0–30 s) is added so multiple tabs never fire at the same instant.
function scheduleProactiveRefresh(token) {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
  if (!token) return;

  try {
    // JWT uses base64url (- and _ instead of + and /). atob needs standard base64.
    const b64url    = token.split('.')[1];
    const b64       = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const payload   = JSON.parse(atob(b64));
    const expiresMs = payload.exp * 1000;
    const jitterMs  = Math.random() * 30_000; // 0–30 s random offset
    const delay     = Math.max(expiresMs - Date.now() - 60_000 - jitterMs, 0);

    _refreshTimer = setTimeout(async () => {
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.accessToken || data.token;
        setAccessToken(newToken);
        // Tell all other open tabs so they don't make their own refresh call
        _channel?.postMessage({ type: 'TOKEN_REFRESH', token: newToken });
      } catch {
        // Refresh token expired / revoked — broadcast logout to all tabs
        clearAccessToken();
        _channel?.postMessage({ type: 'SESSION_EXPIRED' });
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    }, delay);
  } catch {
    // Malformed token — ignore, 401 interceptor is the safety net
  }
}

export const setAccessToken = (t) => {
  _accessToken = t;
  scheduleProactiveRefresh(t);
};

export const clearAccessToken = () => {
  _accessToken = null;
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
};

export const getAccessToken = () => _accessToken;

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/api'
      : process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
});

// ── Refresh-queue state ────────────────────────────────────────────────────────
// Guards against multiple simultaneous 401s (within one tab) all triggering a
// refresh race. The BroadcastChannel handles the cross-tab equivalent.
let isRefreshing = false;
let failedQueue  = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

// ── Request interceptor – attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers['Authorization'] = `Bearer ${_accessToken}`;
      config.headers['x-auth-token']  = _accessToken;
    }
    return config;
  },
  (err) => Promise.reject(err),
);

// ── Response interceptor – fallback silent refresh on 401 ────────────────────
// The proactive timer + BroadcastChannel prevent most 401s. This is the safety
// net for edge cases (tab sleeping, timer throttled by browser, etc.).
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    const skipRetry =
      original._retry ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login');

    if (error.response?.status === 401 && !skipRetry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers['Authorization'] = `Bearer ${token}`;
            original.headers['x-auth-token']  = token;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.accessToken || data.token;
        setAccessToken(newToken);
        _channel?.postMessage({ type: 'TOKEN_REFRESH', token: newToken });
        processQueue(null, newToken);

        original.headers['Authorization'] = `Bearer ${newToken}`;
        original.headers['x-auth-token']  = newToken;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAccessToken();
        _channel?.postMessage({ type: 'SESSION_EXPIRED' });
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
