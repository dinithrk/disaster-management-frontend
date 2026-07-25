import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If the error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if the failed request was the refresh token request or login request
      if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        // Attempt to refresh token using the HttpOnly cookie
        // Use standard axios to avoid interceptor loop
        const res = await axios.post('http://localhost:8080/api/auth/refresh-token', {}, { withCredentials: true });
        const newAccessToken = res.data.token;
        
        // Update the access token in localStorage
        localStorage.setItem('accessToken', newAccessToken);
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear everything and force re-login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
