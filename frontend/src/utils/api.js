
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
  baseURL:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/api'
      : process.env.REACT_APP_API_BASE_URL,

  withCredentials: true // 🔥 MUST (cookie ke liye)
});

// ✅ Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken'); // 🔥 name change
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// ✅ Response interceptor (AUTO REFRESH)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true } // 🔥 important
        );

        const newAccessToken = res.data.accessToken;

        localStorage.setItem('accessToken', newAccessToken);

        originalRequest.headers['x-auth-token'] = newAccessToken;
        return api(originalRequest);

      } catch (err) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;