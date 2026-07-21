// mockData.js
// Simulating the backend services for MVP showcase

let mockAlerts = [
  { alert_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', sensor_id: 1, severity: 'HIGH_CRITICAL', measurement: 105.2, breached_threshold: 100.0, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'ACTIVE' },
  { alert_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', sensor_id: 42, severity: 'HI_WARNING', measurement: 88.5, breached_threshold: 85.0, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'ACKNOWLEDGED' },
  { alert_id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', sensor_id: 15, severity: 'LOW_CRITICAL', measurement: 12.4, breached_threshold: 20.0, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'RESOLVED' },
  { alert_id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90', sensor_id: 88, severity: 'LOW_WARNING', measurement: 45.1, breached_threshold: 50.0, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), status: 'ACTIVE' },
  { alert_id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f90a1', sensor_id: 22, severity: 'HIGH_CRITICAL', measurement: 210.0, breached_threshold: 150.0, timestamp: new Date(Date.now() - 1000 * 60).toISOString(), status: 'ACTIVE' },
];

export const getActiveAlerts = () => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockAlerts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))), 800));
};

// --- METADATA SERVICES: SITES ---
let mockSites = [
  { site_id: 1, site_name: 'North Pipeline Sector A', location: 'POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))' },
  { site_id: 2, site_name: 'East Zone Processor', location: 'POLYGON((20 20, 20 30, 30 30, 30 20, 20 20))' },
  { site_id: 3, site_name: 'Cooling Tower B', location: 'POLYGON((40 40, 40 50, 50 50, 50 40, 40 40))' },
];

export const getSites = () => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockSites]), 500));
};

export const createSite = (site) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSite = { ...site, site_id: mockSites.length + 1 };
      mockSites.push(newSite);
      resolve(newSite);
    }, 500);
  });
};

export const updateSite = (id, updatedSite) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSites = mockSites.map(s => s.site_id === id ? { ...s, ...updatedSite } : s);
      resolve(updatedSite);
    }, 500);
  });
};

export const deleteSite = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSites = mockSites.filter(s => s.site_id !== id);
      resolve(id);
    }, 500);
  });
};

// --- METADATA SERVICES: SENSOR TYPES ---
let mockSensorTypes = [
  { sensor_type_id: 1, type: 'Temperature Pro' },
  { sensor_type_id: 2, type: 'Pressure Gauge V2' },
];

export const getSensorTypes = () => new Promise(res => setTimeout(() => res([...mockSensorTypes]), 500));
export const createSensorType = (type) => new Promise(res => setTimeout(() => {
  const newType = { ...type, sensor_type_id: mockSensorTypes.length + 1 };
  mockSensorTypes.push(newType);
  res(newType);
}, 500));
export const updateSensorType = (id, updated) => new Promise(res => setTimeout(() => {
  mockSensorTypes = mockSensorTypes.map(s => s.sensor_type_id === id ? { ...s, ...updated } : s);
  res(updated);
}, 500));
export const deleteSensorType = (id) => new Promise(res => setTimeout(() => {
  mockSensorTypes = mockSensorTypes.filter(s => s.sensor_type_id !== id);
  res(id);
}, 500));

// --- METADATA SERVICES: SENSORS ---
let mockSensors = [
  { sensor_id: 1, sensor_type_id: 1, site_id: 1, longitude: -122.4194, latitude: 37.7749, unit_of_measure: 'Celsius', threshold_high_warning: 85, threshold_high_critical: 100, threshold_low_warning: 50, threshold_low_critical: 30 },
  { sensor_id: 42, sensor_type_id: 2, site_id: 2, longitude: -118.2437, latitude: 34.0522, unit_of_measure: 'PSI', threshold_high_warning: 80, threshold_high_critical: 95, threshold_low_warning: 40, threshold_low_critical: 20 },
];

export const getSensors = () => new Promise(res => setTimeout(() => res([...mockSensors]), 500));
export const createSensor = (sensor) => new Promise(res => setTimeout(() => {
  const newSensor = { ...sensor, sensor_id: mockSensors.length + 1 };
  mockSensors.push(newSensor);
  res(newSensor);
}, 500));
export const updateSensor = (id, updated) => new Promise(res => setTimeout(() => {
  mockSensors = mockSensors.map(s => s.sensor_id === id ? { ...s, ...updated } : s);
  res(updated);
}, 500));
export const deleteSensor = (id) => new Promise(res => setTimeout(() => {
  mockSensors = mockSensors.filter(s => s.sensor_id !== id);
  res(id);
}, 500));

