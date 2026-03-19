
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
  baseURL: 'https://gpfax.sbs/api',
  withCredentials: true // 🔥 important
});

// ❌ koi token attach nahi
api.interceptors.request.use(config => config);

// ✅ refresh flow
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(
          'https://gpfax.sbs/api/auth/refresh-token',
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