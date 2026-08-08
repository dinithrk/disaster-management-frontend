import React, { useState, useEffect, useMemo } from 'react';
import { 
  AutoComplete, 
  Input, 
  Button, 
  Drawer, 
  Descriptions, 
  Segmented, 
  Spin, 
  message,
  Badge,
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  ThunderboltOutlined,
  DashboardOutlined,
  AimOutlined,
  AlertOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Battery } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { 
  getMapSensors, 
  getActiveAlerts,
  getSensorTelemetry, 
  Sensor, 
  Alert,
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
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryReading[]>([]);
  const [loadingSensors, setLoadingSensors] = useState<boolean>(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Map center/zoom state (defaults to Sri Lanka center: [7.2, 80.6])
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.2, 80.6]);
  const [mapZoom, setMapZoom] = useState<number>(8);

  // Memoize chart threshold object to avoid passing new object reference every clock tick
  const chartThresholds = useMemo(() => {
    if (!selectedSensor) {
      return { highCritical: 0, highWarning: 0, lowWarning: 0, lowCritical: 0 };
    }
    return {
      highCritical: selectedSensor.threshold_high_critical,
      highWarning: selectedSensor.threshold_high_warning,
      lowWarning: selectedSensor.threshold_low_warning,
      lowCritical: selectedSensor.threshold_low_critical,
    };
  }, [
    selectedSensor?.threshold_high_critical,
    selectedSensor?.threshold_high_warning,
    selectedSensor?.threshold_low_warning,
    selectedSensor?.threshold_low_critical,
  ]);

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

  // Fetch sensors and active alerts from real backend APIs on mount
  const fetchDashboardData = async () => {
    setLoadingSensors(true);
    try {
      const [sensorData, alertData] = await Promise.all([
        getMapSensors(),
        getActiveAlerts(),
      ]);
      setSensors(sensorData);
      setActiveAlerts(alertData);
    } catch (err) {
      message.error('Failed to load map sensors or backend alert data.');
    } finally {
      setLoadingSensors(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch telemetry when selected sensor or time range changes
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

  // Handler: Select a sensor (from map marker click or search selection)
  const handleSelectSensor = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setMapCenter([sensor.latitude, sensor.longitude]);
    setMapZoom(12); // Fly and zoom in when selected
  };

  // Helper: Get active alert severity and CSS class for a specific sensor
  const getSensorAlertInfo = (sensorId: string) => {
    const activeAlertsForSensor = activeAlerts.filter(
      (a) => String(a.sensor_id) === String(sensorId) && (a.status === 'ACTIVE' || !a.status)
    );

    if (activeAlertsForSensor.length === 0) {
      return { status: 'NORMAL', severityClass: 'severity-normal', color: 'var(--severity-success)' };
    }

    // Evaluate severity hierarchy if multiple alerts exist
    const hasHighCritical = activeAlertsForSensor.some((a) => a.severity === 'HIGH_CRITICAL');
    if (hasHighCritical) {
      return { status: 'HIGH_CRITICAL', severityClass: 'severity-critical', color: 'var(--severity-hi-critical)' };
    }

    const hasHighWarning = activeAlertsForSensor.some((a) => a.severity === 'HIGH_WARNING');
    if (hasHighWarning) {
      return { status: 'HIGH_WARNING', severityClass: 'severity-warning', color: 'var(--severity-hi-warning)' };
    }

    const hasLowCritical = activeAlertsForSensor.some((a) => a.severity === 'LOW_CRITICAL');
    if (hasLowCritical) {
      return { status: 'LOW_CRITICAL', severityClass: 'severity-low-critical', color: 'var(--severity-low-critical)' };
    }

    const hasLowWarning = activeAlertsForSensor.some((a) => a.severity === 'LOW_WARNING');
    if (hasLowWarning) {
      return { status: 'LOW_WARNING', severityClass: 'severity-low-warning', color: 'var(--severity-low-warning)' };
    }

    return { status: 'NORMAL', severityClass: 'severity-normal', color: 'var(--severity-success)' };
  };

  // Create Leaflet marker icon with dynamic glow & marker color matching alert severity
  const createCustomIcon = (sensor: Sensor) => {
    const { severityClass } = getSensorAlertInfo(sensor.sensor_id);
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

  // Search auto-complete options
  const searchOptions = sensors.map((s) => ({
    value: s.sensor_id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><strong>{s.sensor_id}</strong> - {s.name || `Site ${s.site_id}`}</span>
        <Tag color={getSensorAlertInfo(s.sensor_id).status === 'NORMAL' ? 'green' : 'red'} style={{ fontSize: '10px' }}>
          {getSensorAlertInfo(s.sensor_id).status}
        </Tag>
      </div>
    ),
  }));

  // Handler: Search selection / query submit
  const handleSearchSubmit = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return;

    const found = sensors.find(
      (s) =>
        s.sensor_id.toLowerCase() === query ||
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.site_name && s.site_name.toLowerCase().includes(query)) ||
        s.site_id.toString() === query
    );

    if (found) {
      handleSelectSensor(found);
      message.success(`Found sensor: ${found.sensor_id} (${found.name || 'Station'})`);
    } else {
      message.warning(`No sensor found matching "${value}"`);
    }
  };

  // Extract last recorded battery status from the latest telemetry reading with non-null battery_status
  const latestBattery = (() => {
    if (!telemetry || telemetry.length === 0) return null;
    for (let i = telemetry.length - 1; i >= 0; i--) {
      if (telemetry[i].battery_status !== null && telemetry[i].battery_status !== undefined) {
        return telemetry[i].battery_status;
      }
    }
    return null;
  })();

  return (
    <div className="gis-dashboard">
      {/* Header */}
      <header className="gis-header glass-panel">
        <div className="gis-header-left">
          <DashboardOutlined style={{ fontSize: '20px', color: 'var(--accent-blue)' }} />
          <h1>GIS Telemetry Monitoring Station</h1>
        </div>

        {/* Searchbar */}
        <div className="gis-header-center">
          <div className="gis-search">
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSelect={(val) => {
                const target = sensors.find((s) => s.sensor_id === val);
                if (target) handleSelectSensor(target);
              }}
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              <Input.Search
                placeholder="Search by Sensor ID, Site Name, or Type..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearchSubmit}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </AutoComplete>
          </div>
        </div>

        <div className="gis-header-right">
          <div className="gis-time-display">
            {currentTime}
          </div>
          <Button 
            className="gis-refresh-btn" 
            onClick={fetchDashboardData} 
            loading={loadingSensors}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Map Container */}
      <div className="gis-map-container">
        {/* Reset Zoom helper overlay */}
        <button 
          className="map-reset-zoom" 
          onClick={() => {
            setMapCenter([7.2, 80.6]);
            setMapZoom(8);
          }}
          title="Reset View to Overview"
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
            crossOrigin=""
          />
          
          {/* Map Controller for flyTo animations */}
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Render Sensor Markers based on active alert status */}
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
                {selectedSensor.name || `Sensor ID: ${selectedSensor.sensor_id}`}
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
        {selectedSensor && (() => {
          const alertInfo = getSensorAlertInfo(selectedSensor.sensor_id);
          return (
            <>
              {/* Drawer Stats: Battery Level & Sensor Status */}
              <div className="drawer-stats-row">
                {/* Battery Level Card */}
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

                {/* Active Alert Status Card */}
                <div className="stat-card">
                  <div className="stat-card-left">
                    <span className="stat-card-label">Sensor Status</span>
                    <span 
                      className="stat-card-value" 
                      style={{ 
                        fontSize: '1.1rem', 
                        color: alertInfo.color,
                        fontWeight: 'bold',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {alertInfo.status}
                    </span>
                  </div>
                  <div className="stat-card-icon" style={{ color: alertInfo.color, background: `${alertInfo.color}15` }}>
                    {alertInfo.status === 'NORMAL' ? (
                      <CheckCircleOutlined style={{ fontSize: '22px' }} />
                    ) : (
                      <AlertOutlined style={{ fontSize: '22px' }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Telemetry Chart Section */}
              <div>
                <div className="drawer-section-title">Telemetry Readings</div>
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
                    <span className="chart-loader-text">Fetching historical telemetry readings...</span>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '12px 0', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <TelemetryChart
                      data={telemetry}
                      unit={selectedSensor.unit_of_measure}
                      thresholds={chartThresholds}
                    />
                  </div>
                )}
              </div>

              {/* Detailed Sensor Attributes */}
              <div>
                <div className="drawer-section-title">Sensor Metadata & Thresholds</div>
                <Descriptions column={1} bordered={false} size="small">
                  <Descriptions.Item label="Sensor ID">{selectedSensor.sensor_id}</Descriptions.Item>
                  <Descriptions.Item label="Site">{selectedSensor.site_name || `Site ${selectedSensor.site_id}`}</Descriptions.Item>
                  <Descriptions.Item label="Sensor Type">{selectedSensor.sensor_type_name}</Descriptions.Item>
                  <Descriptions.Item label="Coordinates">{selectedSensor.latitude}, {selectedSensor.longitude}</Descriptions.Item>
                  <Descriptions.Item label="Unit of Measure">{selectedSensor.unit_of_measure}</Descriptions.Item>
                  <Descriptions.Item label="High Critical Threshold">
                    <span style={{ color: 'var(--severity-hi-critical)' }}>{selectedSensor.threshold_high_critical} {selectedSensor.unit_of_measure}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="High Warning Threshold">
                    <span style={{ color: 'var(--severity-hi-warning)' }}>{selectedSensor.threshold_high_warning} {selectedSensor.unit_of_measure}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Low Warning Threshold">
                    <span style={{ color: 'var(--severity-low-warning)' }}>{selectedSensor.threshold_low_warning} {selectedSensor.unit_of_measure}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Low Critical Threshold">
                    <span style={{ color: 'var(--severity-low-critical)' }}>{selectedSensor.threshold_low_critical} {selectedSensor.unit_of_measure}</span>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </>
          );
        })()}
      </Drawer>
    </div>
  );
};

export default GisDashboard;
