import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  Tag, 
  Spin, 
  Drawer, 
  Segmented, 
  Switch, 
  Tooltip, 
  message 
} from 'antd';
import { 
  ReloadOutlined, 
  SearchOutlined, 
  DashboardOutlined, 
  LineChartOutlined,
  ClockCircleOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { 
  Battery, 
  BatteryLow, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Globe, 
  Zap, 
  Radio, 
  History 
} from 'lucide-react';

import { 
  getMapSensors, 
  getAllLatestReadings, 
  getActiveAlerts, 
  getSensorTelemetry 
} from '../services/gisTelemetryApi';
import TelemetryChart from '../components/UI/TelemetryChart';
import SystemHealthGauge from '../components/UI/SystemHealthGauge';
import BatteryDistributionChart from '../components/UI/BatteryDistributionChart';
import './Dashboard.css';

// Helper: Calculate dynamic relative time ("X mins ago", "X hours ago", "X days ago")
const getRelativeTimeAgo = (timestampStr) => {
  if (!timestampStr) return { text: 'No Data', isInactive: true, hoursAgo: 999 };

  const time = new Date(timestampStr).getTime();
  if (isNaN(time)) return { text: 'Invalid Date', isInactive: true, hoursAgo: 999 };

  const now = Date.now();
  const diffMs = Math.max(0, now - time);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isInactive = diffHours >= 48; // Inactive if latest reading was >= 2 days ago

  if (diffMins < 1) {
    return { text: 'Just now', isInactive, hoursAgo: 0, rawMs: diffMs };
  } else if (diffMins < 60) {
    return { text: `${diffMins} min${diffMins > 1 ? 's' : ''} ago`, isInactive, hoursAgo: diffHours, rawMs: diffMs };
  } else if (diffHours < 24) {
    return { text: `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`, isInactive, hoursAgo: diffHours, rawMs: diffMs };
  } else {
    return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`, isInactive, hoursAgo: diffHours, rawMs: diffMs };
  }
};

// Helper: Determine threshold status tag and color
const getThresholdStatus = (sensor, measurement) => {
  if (measurement === undefined || measurement === null) return { text: 'No Data', color: 'default' };

  if (measurement >= sensor.threshold_high_critical) {
    return { text: 'High Critical', color: 'error' };
  }
  if (measurement >= sensor.threshold_high_warning) {
    return { text: 'High Warning', color: 'warning' };
  }
  if (measurement <= sensor.threshold_low_critical) {
    return { text: 'Low Critical', color: 'processing' };
  }
  if (measurement <= sensor.threshold_low_warning) {
    return { text: 'Low Warning', color: 'warning' };
  }
  return { text: 'Normal', color: 'success' };
};

const Dashboard = () => {
  // Core States
  const [sensors, setSensors] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'BY_SITE' | 'LOW_BATTERY' | 'INACTIVE'
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Drawer / Chart detail state
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [telemetry, setTelemetry] = useState([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Fetch Telemetry Data
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [sensorData, readingsMap, alertData] = await Promise.all([
        getMapSensors(),
        getAllLatestReadings(),
        getActiveAlerts(),
      ]);

      setSensors(sensorData);
      setLatestReadings(readingsMap);
      setActiveAlerts(alertData);
    } catch (err) {
      console.error('Error fetching dashboard telemetry data:', err);
      message.error('Failed to update live dashboard telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh interval (every 30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  // Fetch drawer historical telemetry chart
  useEffect(() => {
    if (!selectedSensor) return;
    const fetchTelemetry = async () => {
      setLoadingTelemetry(true);
      try {
        const data = await getSensorTelemetry(selectedSensor.sensor_id, timeRange);
        setTelemetry(data);
      } catch (err) {
        message.error(`Failed to load historical readings for ${selectedSensor.sensor_id}`);
      } finally {
        setLoadingTelemetry(false);
      }
    };
    fetchTelemetry();
  }, [selectedSensor, timeRange]);

  // Enriched Sensors Metrics
  const enrichedSensors = useMemo(() => {
    return sensors.map((sensor) => {
      const latestReading = latestReadings[sensor.sensor_id];
      const timeAgo = getRelativeTimeAgo(latestReading?.timestamp);
      const batteryStatus = latestReading?.battery_status ?? null;
      const isLowBattery = batteryStatus !== null && batteryStatus < 25;
      const isInactive = timeAgo.isInactive;
      const thresholdInfo = getThresholdStatus(sensor, latestReading?.measurement);

      return {
        key: sensor.sensor_id,
        ...sensor,
        latestReading,
        timeAgo,
        batteryStatus,
        isLowBattery,
        isInactive,
        thresholdInfo,
      };
    });
  }, [sensors, latestReadings]);

  // KPI Summary Stats
  const kpiStats = useMemo(() => {
    const total = enrichedSensors.length;
    const lowBattery = enrichedSensors.filter((s) => s.isLowBattery).length;
    const inactive = enrichedSensors.filter((s) => s.isInactive).length;
    const active = total - inactive;
    const healthScore = total > 0 ? (active / total) * 100 : 0;
    return { total, active, lowBattery, inactive, healthScore };
  }, [enrichedSensors]);

  // Timeline Events (Sorted chronologically by latest pulse)
  const timelineEvents = useMemo(() => {
    return [...enrichedSensors].sort((a, b) => (a.timeAgo.rawMs || 0) - (b.timeAgo.rawMs || 0));
  }, [enrichedSensors]);

  // Filter & Search Logic
  const filteredSensors = useMemo(() => {
    return enrichedSensors.filter((s) => {
      const matchesSearch = 
        !searchQuery ||
        s.sensor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.site_name && s.site_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.sensor_type_name && s.sensor_type_name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === 'LOW_BATTERY') return s.isLowBattery;
      if (activeFilter === 'INACTIVE') return s.isInactive;

      return true;
    });
  }, [enrichedSensors, searchQuery, activeFilter]);

  // Group Sensors by Site Name
  const groupedBySite = useMemo(() => {
    const groups = {};
    filteredSensors.forEach((s) => {
      const siteKey = s.site_name || `Site ${s.site_id}`;
      if (!groups[siteKey]) {
        groups[siteKey] = {
          siteName: siteKey,
          siteId: s.site_id,
          sensors: [],
        };
      }
      groups[siteKey].sensors.push(s);
    });
    return Object.values(groups);
  }, [filteredSensors]);

  // Table Columns Definition
  const columns = [
    {
      title: 'Station / ID',
      dataIndex: 'sensor_id',
      key: 'sensor_id',
      render: (text, record) => (
        <div>
          <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.92rem' }}>{text}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.sensor_type_name}</div>
        </div>
      ),
      sorter: (a, b) => a.sensor_id.localeCompare(b.sensor_id),
    },
    {
      title: 'Site Location',
      dataIndex: 'site_name',
      key: 'site_name',
      render: (text, record) => text || `Site ${record.site_id}`,
      sorter: (a, b) => (a.site_name || '').localeCompare(b.site_name || ''),
    },
    {
      title: 'Latest Measurement',
      key: 'latest_reading',
      render: (_, record) => {
        const val = record.latestReading?.measurement;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
              {val !== undefined && val !== null ? `${val} ${record.unit_of_measure}` : '—'}
            </span>
            <Tag color={record.thresholdInfo.color} style={{ margin: 0 }}>
              {record.thresholdInfo.text}
            </Tag>
          </div>
        );
      },
      sorter: (a, b) => (a.latestReading?.measurement || 0) - (b.latestReading?.measurement || 0),
    },
    {
      title: 'Last Reading Time',
      key: 'timestamp',
      render: (_, record) => {
        const formatted = record.latestReading?.timestamp 
          ? new Date(record.latestReading.timestamp).toLocaleString() 
          : 'N/A';
        return (
          <Tooltip title={`Exact Timestamp: ${formatted}`}>
            <span style={{ color: record.isInactive ? '#ef4444' : 'var(--text-secondary)' }}>
              {record.timeAgo.text}
            </span>
          </Tooltip>
        );
      },
      sorter: (a, b) => {
        const timeA = a.latestReading?.timestamp ? new Date(a.latestReading.timestamp).getTime() : 0;
        const timeB = b.latestReading?.timestamp ? new Date(b.latestReading.timestamp).getTime() : 0;
        return timeA - timeB;
      },
    },
    {
      title: 'Battery Level',
      dataIndex: 'batteryStatus',
      key: 'batteryStatus',
      render: (val, record) => {
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
        let fillClass = 'battery-good';
        if (val < 25) fillClass = 'battery-low';
        else if (val < 50) fillClass = 'battery-medium';

        return (
          <div className="mini-battery-bar">
            <div className="mini-battery-track">
              <div className={`mini-battery-fill ${fillClass}`} style={{ width: `${val}%` }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: record.isLowBattery ? '#ef4444' : undefined }}>
              {val}%
            </span>
          </div>
        );
      },
      sorter: (a, b) => (a.batteryStatus || 0) - (b.batteryStatus || 0),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (record.isInactive) {
          return (
            <span className="status-pill inactive">
              <span className="status-dot-sm" /> Inactive
            </span>
          );
        }
        if (record.isLowBattery) {
          return (
            <span className="status-pill warning">
              <span className="status-dot-sm" /> Low Battery
            </span>
          );
        }
        return (
          <span className="status-pill online">
            <span className="status-dot-sm" /> Online
          </span>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<LineChartOutlined />}
          onClick={() => setSelectedSensor(record)}
        >
          Analyze Trend
        </Button>
      ),
    },
  ];

  // Memoize thresholds for detail chart
  const chartThresholds = useMemo(() => {
    if (!selectedSensor) return { highCritical: 0, highWarning: 0, lowWarning: 0, lowCritical: 0 };
    return {
      highCritical: selectedSensor.threshold_high_critical,
      highWarning: selectedSensor.threshold_high_warning,
      lowWarning: selectedSensor.threshold_low_warning,
      lowCritical: selectedSensor.threshold_low_critical,
    };
  }, [selectedSensor]);

  return (
    <div className="dashboard-container page-enter">
      {/* Header Bar */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1>
            <DashboardOutlined style={{ color: 'var(--accent-blue)' }} />
            Telemetry Analytics & Monitoring Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Real-time station telemetry, curved system health gauge, battery distribution, and reading occurrence timeline.
          </p>
        </div>

        <div className="dashboard-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
            <Switch 
              checked={autoRefresh} 
              onChange={setAutoRefresh} 
              size="small" 
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Auto-Refresh (30s)</span>
          </div>

          <Button 
            type="primary"
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={() => loadDashboardData(true)}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Scientific Analytics Row: Health Curved Gauge, Battery Distribution Chart, Timeline */}
      <div className="analytics-grid">
        {/* Card 1: System Telemetry Health Score Meter */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <span><Zap size={16} style={{ color: 'var(--accent-blue)' }} /> System Telemetry Score</span>
          </div>
          <SystemHealthGauge 
            score={kpiStats.healthScore} 
            activeCount={kpiStats.active} 
            totalCount={kpiStats.total} 
          />
        </div>

        {/* Card 2: Battery Level Telemetry Distribution Chart */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <span><BatteryLow size={16} style={{ color: '#ef4444' }} /> Sensor Battery Telemetry Distribution</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low Threshold: 25%</span>
          </div>
          <BatteryDistributionChart sensors={enrichedSensors} />
        </div>

        {/* Card 3: Recent Telemetry Occurrence Timeline */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <span><History size={16} style={{ color: 'var(--accent-purple)' }} /> Reading Occurrence Timeline</span>
          </div>
          <div className="timeline-list">
            {timelineEvents.map((sensor) => (
              <div 
                key={sensor.sensor_id} 
                className="timeline-item"
                onClick={() => setSelectedSensor(sensor)}
              >
                <div className={`timeline-marker ${sensor.isInactive ? 'inactive' : sensor.isLowBattery ? 'warning' : 'active'}`} />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-sensor-id">{sensor.sensor_id}</span>
                    <span className="timeline-time">{sensor.timeAgo.text}</span>
                  </div>
                  <div className="timeline-detail">
                    {sensor.site_name || `Site ${sensor.site_id}`} — <strong>{sensor.latestReading?.measurement !== undefined ? `${sensor.latestReading.measurement} ${sensor.unit_of_measure}` : 'No Data'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="dashboard-controls">
        <div className="filter-group">
          <Segmented
            options={[
              { label: `All Sensors (${kpiStats.total})`, value: 'ALL' },
              { label: 'Categorized by Site', value: 'BY_SITE' },
              { label: `Low Battery (${kpiStats.lowBattery})`, value: 'LOW_BATTERY' },
              { label: `Inactive (${kpiStats.inactive})`, value: 'INACTIVE' },
            ]}
            value={activeFilter}
            onChange={(val) => setActiveFilter(val)}
          />
        </div>

        <div className="dashboard-search">
          <Input 
            prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
            placeholder="Search sensor ID, site, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Table Data View */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Spin size="large" />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading telemetry status...</p>
          </div>
        ) : activeFilter === 'BY_SITE' ? (
          /* Grouped by Site Table View */
          <div>
            {groupedBySite.map((siteGroup) => (
              <div key={siteGroup.siteName}>
                <div className="site-table-header">
                  <span>
                    <Building2 size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--accent-blue)' }} />
                    {siteGroup.siteName}
                  </span>
                  <Tag color="blue">{siteGroup.sensors.length} Sensors</Tag>
                </div>
                <Table 
                  columns={columns}
                  dataSource={siteGroup.sensors}
                  pagination={false}
                  size="middle"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Standard Flat Data Table */
          <Table 
            columns={columns}
            dataSource={filteredSensors}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            size="middle"
          />
        )}
      </div>

      {/* Telemetry Detail Drawer */}
      <Drawer
        title={selectedSensor ? `Sensor ${selectedSensor.sensor_id} Historical Reading` : ''}
        placement="right"
        width={650}
        onClose={() => setSelectedSensor(null)}
        open={Boolean(selectedSensor)}
      >
        {selectedSensor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header info */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedSensor.site_name || `Site ${selectedSensor.site_id}`}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
                Sensor ID: <strong>{selectedSensor.sensor_id}</strong> | Type: {selectedSensor.sensor_type_name}
              </p>
            </div>

            {/* Time range selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Telemetry Trend</span>
              <Segmented
                options={[
                  { label: '1H', value: '1h' },
                  { label: '24H', value: '24h' },
                  { label: '7D', value: '7d' },
                  { label: '30D', value: '30d' },
                ]}
                value={timeRange}
                onChange={(val) => setTimeRange(val)}
              />
            </div>

            {/* Telemetry Chart */}
            {loadingTelemetry ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Spin size="large" />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading chart telemetry...</p>
              </div>
            ) : (
              <div style={{ height: 320, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', padding: '12px 0' }}>
                <TelemetryChart 
                  data={telemetry}
                  unit={selectedSensor.unit_of_measure}
                  thresholds={chartThresholds}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Dashboard;
