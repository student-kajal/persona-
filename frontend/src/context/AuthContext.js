


// import React, { createContext, useState, useEffect, useContext } from 'react';
// import api from '../utils/api';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // ✅ CHANGED - Check both localStorage and sessionStorage
//   useEffect(() => {
//     const checkAuth = async () => {
//       const localToken = localStorage.getItem('token');
//       const sessionToken = sessionStorage.getItem('token');
//       const authToken = localToken || sessionToken;
      
//       if (authToken) {
//         api.defaults.headers.common['x-auth-token'] = authToken;
//         try {
//           const res = await api.get('/auth/me');
//           setUser(res.data);
//           setToken(authToken);
//         } catch {
//           localStorage.removeItem('token');
//           sessionStorage.removeItem('token');
//           setUser(null);
//           setToken(null);
//         }
//       }
//       setLoading(false);
//     };
//     checkAuth();
//   }, []);

//   // ✅ CHANGED - Accept rememberMe parameter
//   const login = async (email, password, rememberMe = false) => {
//     try {
//       const res = await api.post('/auth/login', { email, password });
//       const authToken = res.data.token;
      
//       // ✅ NEW LOGIC - Store based on rememberMe
//       if (rememberMe) {
//         localStorage.setItem('token', authToken);
//         sessionStorage.removeItem('token');
//       } else {
//         sessionStorage.setItem('token', authToken);
//         localStorage.removeItem('token');
//       }
      
//       api.defaults.headers.common['x-auth-token'] = authToken;
//       const userRes = await api.get('/auth/me');
//       setUser(userRes.data);
//       setToken(authToken);
//       return { success: true };
//     } catch (err) {
//       return { success: false, error: err.response?.data?.error || 'Login failed' };
//     }
//   };

//   // ✅ CHANGED - Clear both storages
//   const logout = () => {
//     localStorage.removeItem('token');
//     sessionStorage.removeItem('token');
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
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check auth on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');

      if (token) {
        api.defaults.headers.common['x-auth-token'] = token;

        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          setAccessToken(token);
        } catch {
          localStorage.removeItem('accessToken');
          setUser(null);
          setAccessToken(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // ✅ LOGIN
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      const token = res.data.accessToken;

      localStorage.setItem('accessToken', token);
      api.defaults.headers.common['x-auth-token'] = token;

      const userRes = await api.get('/auth/me');

      setUser(userRes.data);
      setAccessToken(token);

      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Login failed'
      };
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      await api.post('/auth/logout'); // 🔥 backend call
    } catch (err) {}

    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['x-auth-token'];

    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);