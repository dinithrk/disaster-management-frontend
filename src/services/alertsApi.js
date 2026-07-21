// Backend integration for the Alerts feature.

import axios from 'axios';

const alertsApi = axios.create({
    baseURL: '/disaster-management/alerts',
});

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
