

// import React, { createContext, useState, useEffect, useContext } from 'react';
// import api from '../utils/api';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         api.defaults.headers.common['x-auth-token'] = token;
//         try {
//           const res = await api.get('/auth/me');
//           setUser(res.data);
//         } catch {
//           localStorage.removeItem('token');
//           setUser(null);
//         }
//       }
//       setLoading(false);
//     };
//     checkAuth();
//   }, []);

//   const login = async (email, password) => {
//     try {
//       const res = await api.post('/auth/login', { email, password });
//       localStorage.setItem('token', res.data.token);
//       api.defaults.headers.common['x-auth-token'] = res.data.token;
//       const userRes = await api.get('/auth/me');
//       setUser(userRes.data);
//       setToken(res.data.token);
//       return { success: true };
//     } catch (err) {
//       return { success: false, error: err.response?.data?.error || 'Login failed' };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     delete api.defaults.headers.common['x-auth-token'];
//     setUser(null);
//     setToken(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, loading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ CHANGED - Check both localStorage and sessionStorage
  useEffect(() => {
    const checkAuth = async () => {
      const localToken = localStorage.getItem('token');
      const sessionToken = sessionStorage.getItem('token');
      const authToken = localToken || sessionToken;
      
      if (authToken) {
        api.defaults.headers.common['x-auth-token'] = authToken;
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          setToken(authToken);
        } catch {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // ✅ CHANGED - Accept rememberMe parameter
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const authToken = res.data.token;
      
      // ✅ NEW LOGIC - Store based on rememberMe
      if (rememberMe) {
        localStorage.setItem('token', authToken);
        sessionStorage.removeItem('token');
      } else {
        sessionStorage.setItem('token', authToken);
        localStorage.removeItem('token');
      }
      
      api.defaults.headers.common['x-auth-token'] = authToken;
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      setToken(authToken);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  // ✅ CHANGED - Clear both storages
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
