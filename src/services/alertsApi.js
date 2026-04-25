// Backend integration for the Alerts feature.
// The Spring Boot service runs at http://localhost:8080 and is proxied via Vite's dev server

const BASE_URL = '/disaster-management/alerts';

/**
 * Fetches all ACTIVE alerts from the alerting service.
 * Maps the backend's camelCase response to the snake_case shape
 * that Alerts.jsx already expects.
 */

export const getActiveAlerts = async () => {
    const response = await fetch(`${BASE_URL}/active`);

    if (!response.ok) {
        throw new Error(`Failed to fetch active alerts: HTTP ${response.status}`);
    }

    const data = await response.json();

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
