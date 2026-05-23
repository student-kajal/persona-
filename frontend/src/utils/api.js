import axios from 'axios';

// ── In-memory access token (XSS-safe – never written to localStorage) ─────────
let _accessToken  = null;
let _refreshTimer = null;

// ── Proactive refresh scheduler ────────────────────────────────────────────────
// Decodes the JWT exp claim and fires a silent refresh 60 s before expiry.
// This means the user never hits a real 401 due to token age — the token is
// always replaced before the server rejects it.
function scheduleProactiveRefresh(token) {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
  if (!token) return;

  try {
    const payload   = JSON.parse(atob(token.split('.')[1]));
    const expiresMs = payload.exp * 1000;
    const delay     = Math.max(expiresMs - Date.now() - 60_000, 0); // 60 s buffer

    _refreshTimer = setTimeout(async () => {
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.accessToken || data.token;
        setAccessToken(newToken); // also reschedules the next timer
      } catch {
        // Refresh token is also expired / revoked — force logout
        clearAccessToken();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    }, delay);
  } catch {
    // Malformed token — ignore, let the 401 interceptor handle it
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
// Guards against multiple simultaneous 401s all triggering a refresh race.
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
// The proactive timer prevents most 401s. This is a safety net for the cases
// that slip through (e.g., the tab was sleeping and the timer never fired).
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
        processQueue(null, newToken);

        original.headers['Authorization'] = `Bearer ${newToken}`;
        original.headers['x-auth-token']  = newToken;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAccessToken();
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
