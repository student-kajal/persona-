import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken, clearAccessToken } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: try a silent refresh to restore session from httpOnly cookie ──
  // If the cookie is still valid the user never sees a login page on refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
        if (cancelled) return;
        setAccessToken(data.accessToken || data.token);
        const { data: me } = await api.get('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Cross-tab logout + session-expired listener ────────────────────────────
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'auth:logout') {
        clearAccessToken();
        setUser(null);
      }
    };
    const onExpired = () => {
      clearAccessToken();
      setUser(null);
    };
    window.addEventListener('storage',            onStorage);
    window.addEventListener('auth:session-expired', onExpired);
    return () => {
      window.removeEventListener('storage',              onStorage);
      window.removeEventListener('auth:session-expired', onExpired);
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  // rememberMe is forwarded to the backend which sets the cookie duration
  // (7 days normally, 30 days when rememberMe = true).
  const login = async (email, password, rememberMe = false) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, rememberMe });
      setAccessToken(data.accessToken || data.token);
      const { data: me } = await api.get('/auth/me');
      setUser(me);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  // ── Logout (current device) ────────────────────────────────────────────────
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore network errors */ }
    clearAccessToken();
    setUser(null);
    // Notify other open tabs to also log out
    localStorage.setItem('auth:logout', Date.now().toString());
    localStorage.removeItem('auth:logout');
  };

  // ── Logout all devices ─────────────────────────────────────────────────────
  const logoutAll = async () => {
    try { await api.post('/auth/logout-all'); } catch {}
    clearAccessToken();
    setUser(null);
    localStorage.setItem('auth:logout', Date.now().toString());
    localStorage.removeItem('auth:logout');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
