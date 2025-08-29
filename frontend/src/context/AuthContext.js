// import React, { createContext, useState, useEffect, useContext } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         axios.defaults.headers.common['x-auth-token'] = token;
//         try {
//           const res = await axios.get('/api/auth/me');
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
//       const res = await axios.post('/api/auth/login', { email, password });
//       localStorage.setItem('token', res.data.token);
//       axios.defaults.headers.common['x-auth-token'] = res.data.token;
//       const userRes = await axios.get('/api/auth/me');
//       setUser(userRes.data);
//       setToken(res.data.token);
//       return { success: true };
//     } catch (err) {
//       return { success: false, error: err.response?.data?.error || 'Login failed' };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     delete axios.defaults.headers.common['x-auth-token'];
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
// import React, { createContext, useState, useEffect, useContext } from 'react';
// import axios from 'axios';

// const API =
//   process.env.NODE_ENV === 'development'
//     ? 'http://localhost:5000'
//     : process.env.REACT_APP_API_BASE_URL;

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         axios.defaults.headers.common['x-auth-token'] = token;
//         try {
//           const res = await axios.get(`${API}/api/auth/me`);
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
//       const res = await axios.post(`${API}/api/auth/login`, { email, password });
//       localStorage.setItem('token', res.data.token);
//       axios.defaults.headers.common['x-auth-token'] = res.data.token;
//       const userRes = await axios.get(`${API}/api/auth/me`);
//       setUser(userRes.data);
//       setToken(res.data.token);
//       return { success: true };
//     } catch (err) {
//       return { success: false, error: err.response?.data?.error || 'Login failed' };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     delete axios.defaults.headers.common['x-auth-token'];
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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['x-auth-token'] = token;
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      api.defaults.headers.common['x-auth-token'] = res.data.token;
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      setToken(res.data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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
