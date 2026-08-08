import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  Tag, 
  Spin, 
  Drawer, 
  Segmented, 
  Select, 
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
  History, 
  PieChart, 
  PowerOff 
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
import TimelineVisualizationChart from '../components/UI/TimelineVisualizationChart';
import ThresholdDistributionChart from '../components/UI/ThresholdDistributionChart';
import './Dashboard.css';

// Helper: Calculate dynamic relative time ("X mins ago", "X hours ago", "X days ago")
const getRelativeTimeAgo = (timestampStr) => {
  if (!timestampStr) return { text: 'No Data', isInactive: true, isOffline: true, hoursAgo: 999 };

  const time = new Date(timestampStr).getTime();
  if (isNaN(time)) return { text: 'Invalid Date', isInactive: true, isOffline: true, hoursAgo: 999 };

  const now = Date.now();
  const diffMs = Math.max(0, now - time);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isInactive = diffHours >= 48; // Inactive if latest reading was >= 2 days ago

  if (diffMins < 1) {
    return { text: 'Just now', isInactive: false, isOffline: false, hoursAgo: 0, rawMs: diffMs };
  } else if (diffMins < 60) {
    return { text: `${diffMins} min${diffMins > 1 ? 's' : ''} ago`, isInactive: false, isOffline: false, hoursAgo: diffHours, rawMs: diffMs };
  } else if (diffHours < 24) {
    return { text: `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`, isInactive: false, isOffline: false, hoursAgo: diffHours, rawMs: diffMs };
  } else {
    return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`, isInactive, isOffline: diffHours >= 72, hoursAgo: diffHours, rawMs: diffMs };
  }
};

// Helper: Determine threshold status tag and color
const getThresholdStatus = (sensor, measurement) => {
  if (measurement === undefined || measurement === null) return { text: 'No Data', color: 'default', severity: 'NORMAL' };

  if (measurement >= sensor.threshold_high_critical) {
    return { text: 'High Critical', color: 'error', severity: 'HIGH_CRITICAL' };
  }
  if (measurement >= sensor.threshold_high_warning) {
    return { text: 'High Warning', color: 'warning', severity: 'HIGH_WARNING' };
  }
  if (measurement <= sensor.threshold_low_critical) {
    return { text: 'Low Critical', color: 'processing', severity: 'LOW_CRITICAL' };
  }
  if (measurement <= sensor.threshold_low_warning) {
    return { text: 'Low Warning', color: 'warning', severity: 'LOW_WARNING' };
  }
  return { text: 'Normal', color: 'success', severity: 'NORMAL' };
};

const Dashboard = () => {
  // Core States
  const [sensors, setSensors] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'BY_SITE' | 'LOW_BATTERY' | 'INACTIVE' | 'OFFLINE'
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL'); // 'ALL' or site_name
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

  // Enriched Sensors Metrics with precise Offline Status rule
  const enrichedSensors = useMemo(() => {
    return sensors.map((sensor) => {
      const latestReading = latestReadings[sensor.sensor_id];
      const timeAgo = getRelativeTimeAgo(latestReading?.timestamp);
      const batteryStatus = latestReading?.battery_status ?? null;
      
      const isLowBattery = batteryStatus !== null && batteryStatus < 25;
      const isInactive = timeAgo.hoursAgo >= 48;
      
      // Offline definition: latest reading is >= 3 days ago (72h) AND battery status is below 10% (or missing)
      const isOffline = timeAgo.hoursAgo >= 72 && (batteryStatus === null || batteryStatus < 10);

      const thresholdInfo = getThresholdStatus(sensor, latestReading?.measurement);

      return {
        key: sensor.sensor_id,
        ...sensor,
        latestReading,
        timeAgo,
        batteryStatus,
        isLowBattery,
        isInactive,
        isOffline,
        thresholdInfo,
      };
    });
  }, [sensors, latestReadings]);

  // Unique list of sites for dropdown selector
  const siteOptions = useMemo(() => {
    const siteNames = new Set();
    sensors.forEach((s) => {
      const name = s.site_name || `Site ${s.site_id}`;
      siteNames.add(name);
    });
    return ['ALL', ...Array.from(siteNames)];
  }, [sensors]);

  // Analytics sensors list dynamically filtered by Site Selector
  const siteFilteredSensors = useMemo(() => {
    if (selectedSiteFilter === 'ALL') return enrichedSensors;
    return enrichedSensors.filter((s) => (s.site_name || `Site ${s.site_id}`) === selectedSiteFilter);
  }, [enrichedSensors, selectedSiteFilter]);

  // KPI Summary Stats (Calculated for current site filter context)
  const kpiStats = useMemo(() => {
    const total = siteFilteredSensors.length;
    const lowBattery = siteFilteredSensors.filter((s) => s.isLowBattery).length;
    const offline = siteFilteredSensors.filter((s) => s.isOffline).length;
    const inactive = siteFilteredSensors.filter((s) => s.isInactive && !s.isOffline).length;
    const active = total - (inactive + offline);
    const healthScore = total > 0 ? (active / total) * 100 : 0;
    return { total, active, lowBattery, inactive, offline, healthScore };
  }, [siteFilteredSensors]);

  // Filter & Search Logic for Main Table
  const filteredSensors = useMemo(() => {
    return siteFilteredSensors.filter((s) => {
      const matchesSearch = 
        !searchQuery ||
        s.sensor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.site_name && s.site_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.sensor_type_name && s.sensor_type_name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === 'LOW_BATTERY') return s.isLowBattery;
      if (activeFilter === 'INACTIVE') return s.isInactive && !s.isOffline;
      if (activeFilter === 'OFFLINE') return s.isOffline;

      return true;
    });
  }, [siteFilteredSensors, searchQuery, activeFilter]);

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
            <span style={{ color: record.isOffline ? '#b91c1c' : record.isInactive ? '#ef4444' : 'var(--text-secondary)' }}>
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
        if (val < 10) fillClass = 'battery-low';
        else if (val < 25) fillClass = 'battery-low';
        else if (val < 50) fillClass = 'battery-medium';

        return (
          <div className="mini-battery-bar">
            <div className="mini-battery-track">
              <div className={`mini-battery-fill ${fillClass}`} style={{ width: `${val}%` }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: record.isOffline || record.isLowBattery ? '#ef4444' : undefined }}>
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
        if (record.isOffline) {
          return (
            <span className="status-pill offline">
              <span className="status-dot-sm" /> Offline
            </span>
          );
        }
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
            Scientific telemetry visualizations, dynamic site categorization, battery distribution, and reading occurrence timeline.
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

      {/* Scientific Analytics Grid: 4 Dynamic Site-Aware Charts */}
      <div className="analytics-grid">
        {/* Card 1: System Telemetry Health Score Meter */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <span><Zap size={16} style={{ color: 'var(--accent-blue)' }} /> Site Telemetry Score</span>
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
            <span><BatteryLow size={16} style={{ color: '#ef4444' }} /> Battery Distribution</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Low: 25%</span>
          </div>
          <BatteryDistributionChart sensors={siteFilteredSensors} />
        </div>

        {/* Card 3: Timeline Scatter Chart (Reading Occurrence Timeline Visualization) */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <span><History size={16} style={{ color: 'var(--accent-purple)' }} /> Reading Occurrence Timeline</span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>0h - 72h+</span>
          </div>
          <TimelineVisualizationChart 
            sensors={siteFilteredSensors} 
            onSelectSensor={(id) => {
              const s = siteFilteredSensors.find((item) => item.sensor_id === id);
              if (s) setSelectedSensor(s);
            }} 
          />
        </div>

        {/* Card 4: Reading Severity Breakdown Donut Chart */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <span><PieChart size={16} style={{ color: '#22c55e' }} /> Threshold Breakdown</span>
          </div>
          <ThresholdDistributionChart sensors={siteFilteredSensors} />
        </div>
      </div>

      {/* Control Bar: Filter Pills, Dynamic Site Dropdown, Search */}
      <div className="dashboard-controls">
        <div className="filter-group">
          {/* Site Selector Dropdown */}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Site Filter:</span>
          <Select 
            value={selectedSiteFilter}
            onChange={(val) => setSelectedSiteFilter(val)}
            style={{ width: 190 }}
            options={siteOptions.map((site) => ({
              label: site === 'ALL' ? '🌐 All Sites' : site,
              value: site,
            }))}
          />

          <Segmented
            options={[
              { label: `All (${kpiStats.total})`, value: 'ALL' },
              { label: 'Categorized by Site', value: 'BY_SITE' },
              { label: `Low Battery (${kpiStats.lowBattery})`, value: 'LOW_BATTERY' },
              { label: `Inactive (${kpiStats.inactive})`, value: 'INACTIVE' },
              { label: `Offline (${kpiStats.offline})`, value: 'OFFLINE' },
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
