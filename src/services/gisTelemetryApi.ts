import axios from 'axios';
import metadataApi from './metadataApi';
import { getActiveAlerts as fetchActiveAlertsFromApi } from './alertsApi';

// Interfaces mapping directly to database schemas
export interface Sensor {
  sensor_id: string;
  latitude: number;
  longitude: number;
  threshold_high_critical: number;
  threshold_high_warning: number;
  threshold_low_critical: number;
  threshold_low_warning: number;
  unit_of_measure: string;
  sensor_type_id: number;
  site_id: number;
  // UI helper fields for name / description / site
  name?: string;
  site_name?: string;
  sensor_type_name?: string;
}

export interface Alert {
  alert_id: string;
  sensor_id: string;
  severity: 'HIGH_CRITICAL' | 'HIGH_WARNING' | 'LOW_WARNING' | 'LOW_CRITICAL';
  status: 'ACTIVE' | 'RESOLVED';
  measurement: number;
  threshold: number;
  timestamp: string;
  first_created_at?: string;
}

export interface TelemetryReading {
  sensor_id: string;
  timestamp: string;
  battery_status: number | null;
  measurement: number;
  sensor_health?: number;
}

const telemetryApi = axios.create({
  baseURL: '/disaster-management/telemetry',
});

telemetryApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

telemetryApi.interceptors.response.use(
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
        return telemetryApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Fallback Mock Data for local testing if server is unavailable
const MOCK_SENSORS: Sensor[] = [
  {
    sensor_id: '1001',
    latitude: 6.9497,
    longitude: 80.0150,
    threshold_high_critical: 8.0,
    threshold_high_warning: 6.0,
    threshold_low_critical: 1.0,
    threshold_low_warning: 2.0,
    unit_of_measure: 'm',
    sensor_type_id: 1,
    site_id: 101,
    name: 'Kelani River Station 01',
    site_name: 'Kelani River Sector',
    sensor_type_name: 'Water Level Sensor',
  },
  {
    sensor_id: '1002',
    latitude: 7.2896,
    longitude: 80.6324,
    threshold_high_critical: 10.0,
    threshold_high_warning: 7.5,
    threshold_low_critical: 1.5,
    threshold_low_warning: 3.0,
    unit_of_measure: 'm',
    sensor_type_id: 1,
    site_id: 102,
    name: 'Mahaweli River Station 02',
    site_name: 'Mahaweli Hydro Zone',
    sensor_type_name: 'Water Level Sensor',
  },
  {
    sensor_id: '1003',
    latitude: 7.2906,
    longitude: 80.6337,
    threshold_high_critical: 38.0,
    threshold_high_warning: 34.0,
    threshold_low_critical: 14.0,
    threshold_low_warning: 18.0,
    unit_of_measure: '°C',
    sensor_type_id: 2,
    site_id: 103,
    name: 'Kandy Met Weather Station',
    site_name: 'Kandy Central Station',
    sensor_type_name: 'Temperature Sensor',
  },
  {
    sensor_id: '1004',
    latitude: 6.0367,
    longitude: 80.2170,
    threshold_high_critical: 60.0,
    threshold_high_warning: 45.0,
    threshold_low_critical: 2.0,
    threshold_low_warning: 5.0,
    unit_of_measure: 'km/h',
    sensor_type_id: 3,
    site_id: 104,
    name: 'Galle Coastal Station',
    site_name: 'Galle Coast Line',
    sensor_type_name: 'Wind Speed Sensor',
  },
  {
    sensor_id: '1005',
    latitude: 8.5873,
    longitude: 81.2152,
    threshold_high_critical: 4.0,
    threshold_high_warning: 3.0,
    threshold_low_critical: 0.5,
    threshold_low_warning: 1.0,
    unit_of_measure: 'm',
    sensor_type_id: 1,
    site_id: 105,
    name: 'Trincomalee Bay Station',
    site_name: 'Trincomalee Port Area',
    sensor_type_name: 'Water Level Sensor',
  },
  {
    sensor_id: '1006',
    latitude: 7.5023,
    longitude: 80.5501,
    threshold_high_critical: 250.0,
    threshold_high_warning: 180.0,
    threshold_low_critical: 0.0,
    threshold_low_warning: 10.0,
    unit_of_measure: 'mm',
    sensor_type_id: 4,
    site_id: 106,
    name: 'Matale Rain Gauge',
    site_name: 'Matale Hills Observatory',
    sensor_type_name: 'Rainfall Sensor',
  }
];

const getTypeName = (typeId: number): string => {
  switch (typeId) {
    case 1: return 'Water Level Sensor';
    case 2: return 'Temperature Sensor';
    case 3: return 'Wind Speed Sensor';
    case 4: return 'Rainfall Sensor';
    default: return 'Telemetry Sensor';
  }
};

const generateMockTelemetry = (sensorId: string, range: string): TelemetryReading[] => {
  const sensor = MOCK_SENSORS.find(s => s.sensor_id === sensorId) || MOCK_SENSORS[0];
  const now = new Date();
  const readings: TelemetryReading[] = [];
  
  let pointsCount = 12;
  let intervalMinutes = 120;

  switch (range.toLowerCase()) {
    case '1h':
      pointsCount = 12;
      intervalMinutes = 5;
      break;
    case '24h':
      pointsCount = 12;
      intervalMinutes = 120;
      break;
    case '7d':
      pointsCount = 14;
      intervalMinutes = 720;
      break;
    case '30d':
      pointsCount = 30;
      intervalMinutes = 1440;
      break;
  }

  const baseline = (sensor.threshold_high_warning + sensor.threshold_low_warning) / 2;
  const rangeDiff = sensor.threshold_high_warning - sensor.threshold_low_warning;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const angle = (i / pointsCount) * Math.PI * 2;
    const wave = Math.sin(angle) * (rangeDiff * 0.4);
    const noise = (Math.random() - 0.5) * (rangeDiff * 0.15);
    let measurement = baseline + wave + noise;

    if (measurement < 0 && sensor.unit_of_measure !== '°C') {
      measurement = 0;
    }
    measurement = Math.round(measurement * 100) / 100;

    const batteryBase = 85; 
    const battery_status = Math.min(100, Math.max(10, batteryBase - i));

    readings.push({
      sensor_id: sensorId,
      timestamp: timestamp.toISOString(),
      battery_status,
      measurement,
    });
  }

  return readings;
};

// API Fetch Methods
export const getMapSensors = async (): Promise<Sensor[]> => {
  try {
    const res = await metadataApi.get('/sensors');
    const rawSensors = res.data;

    if (!Array.isArray(rawSensors) || rawSensors.length === 0) {
      return MOCK_SENSORS;
    }

    const sitesMap = new Map<number, string>();
    try {
      const sitesRes = await metadataApi.get('/sites');
      if (Array.isArray(sitesRes.data)) {
        sitesRes.data.forEach((s: any) => {
          const sId = s.siteId || s.site_id;
          const sName = s.siteName || s.site_name;
          if (sId) sitesMap.set(sId, sName);
        });
      }
    } catch (e) {
      console.warn('Sites metadata fetch error:', e);
    }

    return rawSensors.map((s: any) => {
      const sensor_id = String(s.sensorId || s.sensor_id || '');
      const site_id = Number(s.siteId || s.site_id || (s.site ? (s.site.siteId || s.site.site_id) : 0));
      const sensor_type_id = Number(s.sensorTypeId || s.sensor_type_id || (s.sensorType ? (s.sensorType.sensorTypeId || s.sensorType.sensor_type_id) : 0));
      const site_name = sitesMap.get(site_id) || (s.site ? (s.site.siteName || s.site.site_name) : undefined);

      return {
        sensor_id,
        latitude: Number(s.latitude || 0),
        longitude: Number(s.longitude || 0),
        threshold_high_critical: Number(s.thresholdHighCritical ?? s.threshold_high_critical ?? 0),
        threshold_high_warning: Number(s.thresholdHighWarning ?? s.threshold_high_warning ?? 0),
        threshold_low_critical: Number(s.thresholdLowCritical ?? s.threshold_low_critical ?? 0),
        threshold_low_warning: Number(s.thresholdLowWarning ?? s.threshold_low_warning ?? 0),
        unit_of_measure: String(s.unitOfMeasure || s.unit_of_measure || ''),
        sensor_type_id,
        site_id,
        site_name,
        name: site_name ? `${site_name} (${sensor_id})` : `Sensor ${sensor_id}`,
        sensor_type_name: s.sensorType?.type || getTypeName(sensor_type_id),
      };
    });
  } catch (err) {
    console.warn('Falling back to mock sensors due to backend error:', err);
    return MOCK_SENSORS;
  }
};

export const getActiveAlerts = async (): Promise<Alert[]> => {
  try {
    const alerts = await fetchActiveAlertsFromApi();
    if (!Array.isArray(alerts)) return [];

    return alerts.map((a: any) => ({
      alert_id: String(a.alert_id || a.alertId),
      sensor_id: String(a.sensor_id || a.sensorId),
      severity: a.severity,
      status: a.status || 'ACTIVE',
      measurement: Number(a.measurement || 0),
      threshold: Number(a.breached_threshold ?? a.threshold ?? 0),
      timestamp: a.timestamp,
      first_created_at: a.first_created_at || a.firstCreatedAt,
    }));
  } catch (err) {
    console.warn('Active alerts fetch warning:', err);
    return [];
  }
};

export const getSensorTelemetry = async (id: string, range: string): Promise<TelemetryReading[]> => {
  try {
    const res = await telemetryApi.get(`/sensor/${encodeURIComponent(id)}?range=${range}`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((r: any) => ({
        sensor_id: String(r.sensor_id || r.sensorId || id),
        timestamp: r.timestamp,
        battery_status: r.batteryStatus !== undefined && r.batteryStatus !== null 
          ? Number(r.batteryStatus) 
          : (r.battery_status !== undefined && r.battery_status !== null ? Number(r.battery_status) : null),
        measurement: Number(r.measurement ?? 0),
        sensor_health: r.sensor_health ?? r.sensorHealth,
      }));
    }
  } catch (err) {
    console.warn(`Live telemetry API error for sensor ${id}, using fallback data:`, err);
  }
  return generateMockTelemetry(id, range);
};

export const getLatestSensorReading = async (id: string): Promise<TelemetryReading | null> => {
  try {
    const res = await telemetryApi.get(`/sensor/${encodeURIComponent(id)}/latest`);
    if (res.data) {
      const r = res.data;
      return {
        sensor_id: String(r.sensor_id || r.sensorId || id),
        timestamp: r.timestamp,
        battery_status: r.batteryStatus !== undefined && r.batteryStatus !== null 
          ? Number(r.batteryStatus) 
          : (r.battery_status !== undefined && r.battery_status !== null ? Number(r.battery_status) : null),
        measurement: Number(r.measurement ?? 0),
        sensor_health: r.sensor_health ?? r.sensorHealth,
      };
    }
  } catch (err) {
    console.warn(`Latest telemetry API error for sensor ${id}:`, err);
  }
  return null;
};

export const getAllLatestReadings = async (): Promise<Record<string, TelemetryReading>> => {
  const latestMap: Record<string, TelemetryReading> = {};
  try {
    const res = await telemetryApi.get('/latest-all');
    if (Array.isArray(res.data) && res.data.length > 0) {
      res.data.forEach((r: any) => {
        const sId = String(r.sensor_id || r.sensorId || '');
        if (sId) {
          latestMap[sId] = {
            sensor_id: sId,
            timestamp: r.timestamp,
            battery_status: r.batteryStatus !== undefined && r.batteryStatus !== null 
              ? Number(r.batteryStatus) 
              : (r.battery_status !== undefined && r.battery_status !== null ? Number(r.battery_status) : null),
            measurement: Number(r.measurement ?? 0),
            sensor_health: r.sensor_health ?? r.sensorHealth,
          };
        }
      });
      return latestMap;
    }
  } catch (err) {
    console.warn('Batch latest telemetry API unavailable, generating fallback readings:', err);
  }

  // Fallback mock latest readings with varying timestamps and battery levels
  const now = Date.now();
  const mockReadings: TelemetryReading[] = [
    { sensor_id: '1001', timestamp: new Date(now - 10 * 60 * 1000).toISOString(), battery_status: 92, measurement: 6.8 },
    { sensor_id: '1002', timestamp: new Date(now - 25 * 60 * 1000).toISOString(), battery_status: 18, measurement: 8.1 },
    { sensor_id: '1003', timestamp: new Date(now - 2 * 3600 * 1000).toISOString(), battery_status: 74, measurement: 28.5 },
    { sensor_id: '1004', timestamp: new Date(now - 74 * 3600 * 1000).toISOString(), battery_status: 8, measurement: 32.0 }, // Offline: >= 3 days & battery < 10%
    { sensor_id: '1005', timestamp: new Date(now - 52 * 3600 * 1000).toISOString(), battery_status: 88, measurement: 1.2 },  // Inactive: >= 2 days
    { sensor_id: '1006', timestamp: new Date(now - 15 * 60 * 1000).toISOString(), battery_status: 45, measurement: 195.0 },
  ];

  mockReadings.forEach((r) => {
    latestMap[r.sensor_id] = r;
  });

  return latestMap;
};
