import axios from 'axios';

//const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: 'http://localhost:5000/api' || 'https://gp-fax.onrender.com/api'  // your backend server address and port
    //baseURL: `${base}/api`
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default api;
