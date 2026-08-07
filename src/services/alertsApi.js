// Backend integration for the Alerts feature.

import axios from 'axios';

const alertsApi = axios.create({
    baseURL: '/disaster-management/alerts',
});

alertsApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

alertsApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await axios.post('http://localhost:8096/api/auth/refresh-token', {}, { withCredentials: true });
                const newAccessToken = res.data.token;
                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return alertsApi(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Fetches all ACTIVE alerts from the alerting service.
 * Maps the backend's camelCase response to the snake_case shape
 */

export const getActiveAlerts = async () => {
    const response = await alertsApi.get('/active');
    const data = response.data;

    return data.map((alert) => ({
        alert_id: alert.alertId,
        sensor_id: alert.sensorId,
        severity: alert.severity,
        measurement: alert.measurement,
        breached_threshold: alert.threshold,
        timestamp: alert.timestamp,
        first_created_at: alert.firstCreatedAt,
    }));
};
