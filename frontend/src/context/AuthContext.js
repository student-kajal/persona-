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
import axios from 'axios';

// ✅ BASE URL: 
// Agar local par ho toh 'http://localhost:5000/api'
// Agar production (Vercel pe) hai toh .env mein REACT_APP_API_BASE_URL=https://gp-fax.onrender.com/api hona chahiye
const API =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'
    : process.env.REACT_APP_API_BASE_URL;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
        try {
          // 💡 BASE URL already has /api, toh endpoint sirf /auth/me lagao
          const res = await axios.get(`${API}/auth/me`);
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
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      const userRes = await axios.get(`${API}/auth/me`);
      setUser(userRes.data);
      setToken(res.data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
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
