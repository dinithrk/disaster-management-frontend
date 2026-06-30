import React, { useState, useEffect, useRef } from 'react';
import { 
  Input, 
  Button, 
  Drawer, 
  Descriptions, 
  Segmented, 
  Spin, 
  message,
  Card 
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  ThunderboltOutlined,
  HeartOutlined,
  DashboardOutlined,
  AimOutlined
} from '@ant-design/icons';
import { Battery } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { 
  getMapSensors, 
  getSensorTelemetry, 
  Sensor, 
  TelemetryReading 
} from '../services/gisTelemetryApi';
import TelemetryChart from '../components/UI/TelemetryChart';
import './GisDashboard.css';

// Component to dynamically change map view (center/zoom) with flyTo animation
interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);
  return null;
};

const GisDashboard: React.FC = () => {
  // States
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Map center/zoom state (defaults to Sri Lanka center: [7.8731, 80.7718])
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.2, 80.6]);
  const [mapZoom, setMapZoom] = useState<number>(8);

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch sensors on mount
  const fetchSensors = async () => {
    setLoadingSensors(true);
    try {
      const data = await getMapSensors();
      setSensors(data);
    } catch (err) {
      message.error('Failed to load sensors.');
    } finally {
      setLoadingSensors(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  // Fetch telemetry when sensor or time range changes
  useEffect(() => {
    if (!selectedSensor) return;

    const fetchTelemetry = async () => {
      setLoadingTelemetry(true);
      try {
        const data = await getSensorTelemetry(selectedSensor.sensor_id, timeRange);
        setTelemetry(data);
      } catch (err) {
        message.error(`Failed to load telemetry for sensor ${selectedSensor.sensor_id}`);
      } finally {
        setLoadingTelemetry(false);
      }
    };

    fetchTelemetry();
  }, [selectedSensor, timeRange]);

  // Handler: Select a sensor (from map click or search selection)
  const handleSelectSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setMapCenter([sensor.latitude, sensor.longitude]);
    setMapZoom(11); // zoom in when selected
  };

  // Handler: Search sensor by ID
  const handleSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;

    // Find sensor matching ID (exact or partial)
    const found = sensors.find(
      (s) => s.sensor_id.toString() === query || 
             (s.name && s.name.toLowerCase().includes(query.toLowerCase()))
    );

    if (found) {
      handleSelectSensor(found);
      message.success(`Found: ${found.name || `Sensor ${found.sensor_id}`}`);
    } else {
      message.warning(`No sensor found matching "${query}"`);
    }
  };

  // Helper: Get marker severity class depending on threshold boundaries
  const getSeverityClass = (sensor: Sensor): string => {
    if (!sensor.severity) return 'severity-normal';
    const sev = sensor.severity.toUpperCase();
    if (sev === 'HIGH_CRITICAL') return 'severity-critical';
    if (sev === 'HIGH_WARNING') return 'severity-warning';
    if (sev === 'LOW_WARNING') return 'severity-low-warning';
    if (sev === 'LOW_CRITICAL') return 'severity-low-critical';
    return 'severity-normal';
  };

  // Create custom marker icons dynamically
  const createCustomIcon = (sensor: Sensor) => {
    const severityClass = getSeverityClass(sensor);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="custom-gps-marker ${severityClass}">
          <div class="marker-pulse"></div>
          <div class="marker-dot"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Extract last recorded battery status from telemetry
  const latestBattery = telemetry.length > 0 
    ? telemetry[telemetry.length - 1].battery_status 
    : null;

  return (
    <div className="gis-dashboard">
      {/* Header */}
      <header className="gis-header glass-panel">
        <div className="gis-header-left">
          <DashboardOutlined style={{ fontSize: '20px', color: 'var(--accent-blue)' }} />
          <h1>ATLAS Telemetry GIS Monitor</h1>
        </div>

        <div className="gis-header-center">
          <div className="gis-search">
            <Input.Search
              placeholder="Search Sensor ID or Station Name..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="gis-header-right">
          <div className="gis-time-display">
            {currentTime}
          </div>
          <Button 
            className="gis-refresh-btn" 
            onClick={fetchSensors} 
            loading={loadingSensors}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="gis-map-container">
        {/* Reset Zoom helper overlay */}
        <button 
          className="map-reset-zoom" 
          onClick={() => {
            setMapCenter([7.2, 80.6]);
            setMapZoom(8);
          }}
          title="Reset View"
        >
          <AimOutlined style={{ fontSize: '18px' }} />
        </button>

        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="gis-map"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Map Controller for flying animations */}
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Render Sensor Markers */}
          {sensors.map((sensor) => (
            <Marker
              key={sensor.sensor_id}
              position={[sensor.latitude, sensor.longitude]}
              icon={createCustomIcon(sensor)}
              eventHandlers={{
                click: () => handleSelectSensor(sensor),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Sensor Details Drawer */}
      <Drawer
        title={
          selectedSensor ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {selectedSensor.name || `Station ID: ${selectedSensor.sensor_id}`}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                {selectedSensor.sensor_type_name}
              </span>
            </div>
          ) : 'Sensor Details'
        }
        placement="right"
        width="38%"
        closable={true}
        onClose={() => setSelectedSensor(null)}
        open={selectedSensor !== null}
        className="gis-drawer"
      >
        {selectedSensor && (
          <>
            {/* Drawer Stats / Battery Status */}
            <div className="drawer-stats-row">
              <div className="stat-card">
                <div className="stat-card-left">
                  <span className="stat-card-label">Battery Level</span>
                  <span className="stat-card-value">
                    {latestBattery !== null ? `${latestBattery}%` : 'N/A'}
                  </span>
                </div>
                <div className={`stat-card-icon ${latestBattery !== null && latestBattery > 25 ? 'battery-ok' : 'battery-low'}`}>
                  <Battery size={22} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-left">
                  <span className="stat-card-label">Sensor Status</span>
                  <span className="stat-card-value" style={{ 
                    fontSize: '1.15rem', 
                    color: getSeverityClass(selectedSensor) === 'severity-normal' 
                      ? 'var(--severity-success)' 
                      : getSeverityClass(selectedSensor) === 'severity-critical' 
                        ? 'var(--severity-hi-critical)' 
                        : 'var(--severity-hi-warning)'
                  }}>
                    {getSeverityClass(selectedSensor) === 'severity-normal' 
                      ? 'NORMAL' 
                      : getSeverityClass(selectedSensor) === 'severity-critical' 
                        ? 'CRITICAL' 
                        : 'WARNING'}
                  </span>
                </div>
                <div className="stat-card-icon">
                  <ThunderboltOutlined style={{ fontSize: '22px' }} />
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div>
              <div className="drawer-section-title">Telemetry Trend</div>
              <div className="segmented-control-container">
                <Segmented
                  options={[
                    { label: '1H', value: '1h' },
                    { label: '24H', value: '24h' },
                    { label: '7D', value: '7d' },
                    { label: '30D', value: '30d' },
                  ]}
                  value={timeRange}
                  onChange={(value) => setTimeRange(value as string)}
                />
              </div>

              {/* Telemetry Chart with Spin Loader */}
              {loadingTelemetry ? (
                <div className="chart-loader-container">
                  <Spin size="large" />
                  <span className="chart-loader-text">Fetching historical data...</span>
                </div>
              ) : (
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '12px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <TelemetryChart
                    data={telemetry}
                    unit={selectedSensor.unit_of_measure}
                    thresholds={{
                      highCritical: selectedSensor.threshold_high_critical,
                      highWarning: selectedSensor.threshold_high_warning,
                      lowWarning: selectedSensor.threshold_low_warning,
                      lowCritical: selectedSensor.threshold_low_critical,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Detailed Metadata Descriptions */}
            <div>
              <div className="drawer-section-title">Sensor Attributes</div>
              <Descriptions column={1} bordered={false} size="small">
                <Descriptions.Item label="Sensor ID">{selectedSensor.sensor_id}</Descriptions.Item>
                <Descriptions.Item label="Site ID">{selectedSensor.site_id}</Descriptions.Item>
                <Descriptions.Item label="Sensor Type ID">{selectedSensor.sensor_type_id}</Descriptions.Item>
                <Descriptions.Item label="Latitude">{selectedSensor.latitude}</Descriptions.Item>
                <Descriptions.Item label="Longitude">{selectedSensor.longitude}</Descriptions.Item>
                <Descriptions.Item label="Unit of Measure">{selectedSensor.unit_of_measure}</Descriptions.Item>
                <Descriptions.Item label="High Critical">{selectedSensor.threshold_high_critical} {selectedSensor.unit_of_measure}</Descriptions.Item>
                <Descriptions.Item label="High Warning">{selectedSensor.threshold_high_warning} {selectedSensor.unit_of_measure}</Descriptions.Item>
                <Descriptions.Item label="Low Warning">{selectedSensor.threshold_low_warning} {selectedSensor.unit_of_measure}</Descriptions.Item>
                <Descriptions.Item label="Low Critical">{selectedSensor.threshold_low_critical} {selectedSensor.unit_of_measure}</Descriptions.Item>
              </Descriptions>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default GisDashboard;
