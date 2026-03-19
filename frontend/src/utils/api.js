
// import axios from 'axios';

// const api = axios.create({
//   baseURL:
//     process.env.NODE_ENV === 'development'
//       ? 'http://localhost:5000/api'
//       : process.env.REACT_APP_API_BASE_URL   // /api already laga hua hai!
// });

// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers['x-auth-token'] = token;
//   }
//   return config;
// });

// export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://72.61.243.157:5000/api',
  withCredentials: true // 🔥 MUST
});

// ❌ TOKEN HEADER REMOVE
api.interceptors.request.use(config => {
  return config;
});

// ✅ AUTO REFRESH (optional but ok)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(
          'http://72.61.243.157:5000/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        return api(originalRequest);

      } catch (err) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;