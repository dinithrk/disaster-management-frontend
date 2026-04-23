import React, { useState, useEffect } from 'react';
import { getActiveAlerts } from '../services/mockData';
import { ShieldAlert, AlertOctagon, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import './Alerts.css';

const SeverityConfig = {
  'HIGH_CRITICAL': { color: 'var(--severity-hi-critical)', glow: 'var(--glow-hi-critical)', icon: ShieldAlert, label: 'High Critical' },
  'HI_WARNING': { color: 'var(--severity-hi-warning)', glow: 'var(--glow-hi-warning)', icon: AlertOctagon, label: 'High Warning' },
  'LOW_WARNING': { color: 'var(--severity-low-warning)', glow: 'var(--glow-low-warning)', icon: AlertTriangle, label: 'Low Warning' },
  'LOW_CRITICAL': { color: 'var(--severity-low-critical)', glow: 'var(--glow-low-critical)', icon: AlertCircle, label: 'Low Critical' }
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getActiveAlerts();
      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="page-enter alerts-page">
      <header className="page-header">
        <div>
          <h1>Active Alerts</h1>
          <p>Monitor real-time critical events across all system components.</p>
        </div>
        <button className="primary-button" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'icon-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className="glass-card table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Scanning sensor network...</p>
          </div>
        ) : (
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert ID</th>
                <th>Sensor ID</th>
                <th>Measurement</th>
                <th>Threshold</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No active alerts. System is normal.</td>
                </tr>
              ) : (
                alerts.map(alert => {
                  const config = SeverityConfig[alert.severity];
                  const Icon = config.icon;
                  
                  return (
                    <tr key={alert.alert_id} className="alert-row">
                      <td>
                        <div className="severity-badge" style={{ 
                          '--badge-color': config.color,
                          '--badge-glow': config.glow 
                        }}>
                          <Icon size={16} />
                          <span>{config.label}</span>
                        </div>
                      </td>
                      <td className="font-mono text-muted" title={alert.alert_id}>
                        {alert.alert_id.split('-')[0]}...
                      </td>
                      <td className="font-medium text-white">{alert.sensor_id}</td>
                      <td className="font-mono severity-text" style={{ color: config.color }}>
                        {alert.measurement.toFixed(1)}
                      </td>
                      <td className="font-mono text-muted">{alert.breached_threshold.toFixed(1)}</td>
                      <td className="text-sm">{formatDate(alert.timestamp)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Alerts;
