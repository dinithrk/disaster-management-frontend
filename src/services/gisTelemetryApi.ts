import axios from 'axios';

// Interfaces mapping to database schemas
export interface Sensor {
  sensor_id: number;
  latitude: number;
  longitude: number;
  threshold_high_critical: number;
  threshold_high_warning: number;
  threshold_low_critical: number;
  threshold_low_warning: number;
  unit_of_measure: string;
  sensor_type_id: number;
  site_id: number;
  // UI helper fields for name / description
  name?: string;
  sensor_type_name?: string;
  severity?: string; // Real-time alert status
}

export interface TelemetryReading {
  sensor_id: number;
  timestamp: string;
  battery_status: number;
  measurement: number;
}

// Axios clients for backend microservices
const metadataApi = axios.create({
  baseURL: '/metadata-api',
  timeout: 5000,
});

const alertsApi = axios.create({
  baseURL: '/disaster-management/alerts',
  timeout: 5000,
});

// Projected Axios client for the future GIS telemetry microservice
const gisTelemetryApi = axios.create({
  baseURL: '/gis-api',
  timeout: 5000,
});

// Realistic Mock Data for local testing/fallback
const MOCK_SENSORS: Sensor[] = [
  {
    sensor_id: 1001,
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
    sensor_type_name: 'Water Level Sensor',
    severity: 'NORMAL'
  },
  {
    sensor_id: 1002,
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
    sensor_type_name: 'Water Level Sensor',
    severity: 'NORMAL'
  },
  {
    sensor_id: 1003,
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
    sensor_type_name: 'Temperature Sensor',
    severity: 'NORMAL'
  },
  {
    sensor_id: 1004,
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
    sensor_type_name: 'Wind Speed Sensor',
    severity: 'NORMAL'
  },
  {
    sensor_id: 1005,
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
    sensor_type_name: 'Water Level Sensor',
    severity: 'NORMAL'
  },
  {
    sensor_id: 1006,
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
    sensor_type_name: 'Rainfall Sensor',
    severity: 'NORMAL'
  }
];

// Helper to generate dynamic mock telemetry based on range and sensor thresholds
const generateMockTelemetry = (sensorId: number, range: string): TelemetryReading[] => {
  const sensor = MOCK_SENSORS.find(s => s.sensor_id === sensorId) || MOCK_SENSORS[0];
  const now = new Date();
  const readings: TelemetryReading[] = [];
  
  let pointsCount = 12;
  let intervalMinutes = 120; // default for 24h: 2 hours

  switch (range.toLowerCase()) {
    case '1h':
      pointsCount = 12;
      intervalMinutes = 5; // 5 mins
      break;
    case '24h':
      pointsCount = 12;
      intervalMinutes = 120; // 2 hours
      break;
    case '7d':
      pointsCount = 14;
      intervalMinutes = 720; // 12 hours
      break;
    case '30d':
      pointsCount = 30;
      intervalMinutes = 1440; // 24 hours
      break;
  }

  // Determine a reasonable baseline and noise level
  const baseline = (sensor.threshold_high_warning + sensor.threshold_low_warning) / 2;
  const rangeDiff = sensor.threshold_high_warning - sensor.threshold_low_warning;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    
    // Add sinusoidal wave + random noise
    const angle = (i / pointsCount) * Math.PI * 2;
    const wave = Math.sin(angle) * (rangeDiff * 0.4);
    const noise = (Math.random() - 0.5) * (rangeDiff * 0.15);
    let measurement = baseline + wave + noise;

    // Ensure it stays within positive or logical boundaries
    if (measurement < 0 && sensor.unit_of_measure !== '°C') {
      measurement = 0;
    }
    measurement = Math.round(measurement * 100) / 100;

    // Battery drains slowly backwards in time (meaning it goes up towards the past)
    const batteryBase = 72; 
    const batteryNoise = Math.floor(Math.sin(angle) * 3);
    const battery_status = Math.min(100, Math.max(0, batteryBase + batteryNoise - i));

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
    // 1. Fetch sensors metadata
    const sensorsRes = await metadataApi.get('/sensors');
    const backendSensors = sensorsRes.data;

    // 2. Fetch active alerts to determine live severity
    let activeAlerts: any[] = [];
    try {
      const alertsRes = await alertsApi.get('/active');
      activeAlerts = alertsRes.data;
    } catch (alertError) {
      console.warn('Failed to fetch active alerts, fallback to normal severity:', alertError);
    }

    const alertsMap = new Map<string, string>();
    activeAlerts.forEach((alert: any) => {
      if (alert.sensorId) {
        alertsMap.set(String(alert.sensorId), alert.severity);
      }
    });

    // 3. Transform backend format to frontend format
    return backendSensors.map((sensor: any) => {
      const sIdStr = String(sensor.sensorId);
      const severity = alertsMap.get(sIdStr) || 'NORMAL';
      
      return {
        sensor_id: Number(sensor.sensorId) || 0,
        latitude: sensor.latitude,
        longitude: sensor.longitude,
        threshold_high_critical: sensor.thresholdHighCritical,
        threshold_high_warning: sensor.thresholdHighWarning,
        threshold_low_critical: sensor.thresholdLowCritical,
        threshold_low_warning: sensor.thresholdLowWarning,
        unit_of_measure: sensor.unitOfMeasure,
        sensor_type_id: sensor.sensorType?.sensorTypeId || 0,
        site_id: sensor.site?.siteId || 0,
        name: sensor.site?.siteName || `Sensor ${sensor.sensorId}`,
        sensor_type_name: sensor.sensorType?.type || 'Unknown Sensor',
        severity: severity,
      };
    });
  } catch (error) {
    console.error('Error fetching map sensors, falling back to mock data:', error);
    return Promise.resolve(MOCK_SENSORS);
  }
};

export const getSensorTelemetry = async (id: number, range: string): Promise<TelemetryReading[]> => {
  try {
    const res = await gisTelemetryApi.get(`/telemetry/${id}`, {
      params: { range }
    });
    
    return res.data.map((reading: any) => ({
      sensor_id: Number(reading.sensorId) || id,
      timestamp: reading.timestamp,
      battery_status: reading.sensorHealth !== null && reading.sensorHealth !== undefined 
        ? Math.round(reading.sensorHealth) 
        : 100,
      measurement: reading.measurement,
    }));
  } catch (error) {
    console.warn(`Failed to fetch telemetry from future microservice for sensor ${id}, falling back to mock data:`, error);
    return Promise.resolve(generateMockTelemetry(id, range));
  }
};

const getTypeName = (typeId: number): string => {
  switch (typeId) {
    case 1: return 'Water Level Sensor';
    case 2: return 'Temperature Sensor';
    case 3: return 'Wind Speed Sensor';
    case 4: return 'Rainfall Sensor';
    default: return 'Telemetry Sensor';
  }
};
