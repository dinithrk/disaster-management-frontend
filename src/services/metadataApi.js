import axios from 'axios';

const metadataApi = axios.create({
    baseURL: '/metadata-api',
});

metadataApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

metadataApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If the error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token using the HttpOnly cookie
        // Use standard axios to avoid interceptor loop
        const res = await axios.post('http://localhost:8096/api/auth/refresh-token', {}, { withCredentials: true });
        const newAccessToken = res.data.token;
        
        // Update the access token in localStorage
        localStorage.setItem('accessToken', newAccessToken);
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return metadataApi(originalRequest);
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

export default metadataApi;