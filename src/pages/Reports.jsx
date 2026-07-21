import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, // Added for PDF icon decoration
  History, 
  X, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { 
  downloadAlertsReport, 
  downloadTelemetryReport, 
  triggerFileDownload 
} from '../services/reportsApi';
import './Reports.css';
import '../components/UI/Shared.css';

// Helper to format date into local YYYY-MM-DDTHH:mm format for datetime-local input
const toLocalDatetimeString = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

// Helper to format local datetime input value into UTC ISO-8601 Instant string
const formatToInstant = (datetimeStr) => {
  if (!datetimeStr) return null;
  try {
    return new Date(datetimeStr).toISOString();
  } catch (e) {
    return null;
  }
};

const Reports = () => {
  // Report Form States
  const [reportType, setReportType] = useState('telemetry'); // 'telemetry' | 'alerts'
  const [format, setFormat] = useState('pdf');              // DYNAMIC EXTENSION STATE: 'pdf' | 'xlsx'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState('24h');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [history, setHistory] = useState([]);

  // Load initial dates and download history
  useEffect(() => {
    applyQuickRange('30d');

    const savedHistory = localStorage.getItem('atlas_report_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse report history', e);
      }
    }
  }, []);

  const applyQuickRange = (rangeType) => {
    setQuickRange(rangeType);
    const now = new Date();
    let start = new Date();

    switch (rangeType) {
      case '24h':
        start.setHours(now.getHours() - 24);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case 'custom':
        return;
      default:
        start.setHours(now.getHours() - 24);
    }

    setStartDate(toLocalDatetimeString(start));
    setEndDate(toLocalDatetimeString(now));
  };

  const handleDateChange = (type, val) => {
    setQuickRange('custom');
    if (type === 'start') {
      setStartDate(val);
    } else {
      setEndDate(val);
    }
  };

  const addToHistory = (type, start, end, reportFormat, status) => {
    const newItem = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      format: reportFormat, // Persist format type
      startDate: start,
      endDate: end,
      timestamp: new Date().toLocaleString(),
      status,
    };
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('atlas_report_history', JSON.stringify(updatedHistory));
  };

  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();

    if (!startDate || !endDate) {
      triggerNotification('error', 'Please specify both start and end date/time parameters.');
      return;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime >= endDateTime) {
      triggerNotification('error', 'Start Date must be earlier than End Date.');
      return;
    }

    setLoading(true);
    setNotification(null);

    const payload = {
      reportType: reportType === 'telemetry' ? 'TELEMETRY' : 'ALERTS',
      format: format, // Bound to interactive dropdown selection state
      startDate: formatToInstant(startDate),
      endDate: formatToInstant(endDate)
    };

    try {
      let blob;
      let defaultFileName = '';
      const baseName = `${reportType}_report`;

      if (reportType === 'telemetry') {
        blob = await downloadTelemetryReport(payload);
      } else {
        blob = await downloadAlertsReport(payload);
      }

      if (!blob || blob.size === 0) {
        throw new Error('Received empty file payload. Check server logs.');
      }

      // Execute enhanced download routing passing format parameters
      triggerFileDownload(blob, baseName, format);
      
      defaultFileName = `${baseName}_${Date.now()}.${format}`;
      addToHistory(reportType, startDate, endDate, format, 'success');
      triggerNotification('success', `Report successfully downloaded: ${defaultFileName}`);
    } catch (err) {
      console.error('Failed to generate report', err);
      addToHistory(reportType, startDate, endDate, format, 'error');
      triggerNotification('error', `Failed to generate report: ${err.message || 'Server connection issue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReDownload = async (item) => {
    setLoading(true);
    setNotification(null);

    const itemFormat = item.format || 'csv'; // Fallback for old history records

    const payload = {
      reportType: item.type === 'telemetry' ? 'Telemetry Logs' : 'Incident Alerts',
      format: itemFormat,
      startDate: formatToInstant(item.startDate),
      endDate: formatToInstant(item.endDate)
    };

    try {
      let blob;
      const baseName = `${item.type}_report_ref`;

      if (item.type === 'telemetry') {
        blob = await downloadTelemetryReport(payload);
      } else {
        blob = await downloadAlertsReport(payload);
      }

      if (!blob || blob.size === 0) {
        throw new Error('Received empty file payload.');
      }

      triggerFileDownload(blob, baseName, itemFormat);
      triggerNotification('success', `Report re-downloaded successfully as ${itemFormat.toUpperCase()}`);
    } catch (err) {
      console.error('Failed re-downloading report', err);
      triggerNotification('error', `Failed re-downloading report: ${err.message || 'Server connection issue'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('atlas_report_history');
    triggerNotification('success', 'Download history cleared.');
  };

  const formatDisplayDate = (datetimeStr) => {
    if (!datetimeStr) return '';
    const d = new Date(datetimeStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="page-enter reports-page">
      <header className="page-header">
        <div>
          <h1>System Reports</h1>
          <p className="subtitle">Configure and compile operational records and system events into documents or spreadsheet reports.</p>
        </div>
      </header>

      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
          </div>
          <button className="notification-close" onClick={() => setNotification(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="reports-grid">
        {/* Report Configuration Panel */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet className="text-primary" size={22} />
            Configure Report
          </h2>

          <form onSubmit={handleGenerateReport} className="crud-form">
            <div className="form-group">
              <label>1. Select Report Category</label>
              <div className="report-type-selectors">
                <div 
                  className={`selector-card glass-panel ${reportType === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setReportType('telemetry')}
                >
                  <div className="selector-header">
                    <div className="selector-icon-wrapper">
                      <Activity size={22} style={{ color: reportType === 'telemetry' ? 'var(--accent-blue)' : 'var(--text-secondary)' }} />
                    </div>
                    <h3>Telemetry Log</h3>
                  </div>
                  <p>Sensor water levels, historical measurements, station indices, and sensor health logs.</p>
                </div>

                <div 
                  className={`selector-card glass-panel ${reportType === 'alerts' ? 'active' : ''}`}
                  onClick={() => setReportType('alerts')}
                >
                  <div className="selector-header">
                    <div className="selector-icon-wrapper">
                      <AlertTriangle size={22} style={{ color: reportType === 'alerts' ? 'var(--severity-hi-warning)' : 'var(--text-secondary)' }} />
                    </div>
                    <h3>Incident Alerts</h3>
                  </div>
                  <p>Critical thresholds breaches, severity levels, active/resolved alerts, and alert triggers.</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>2. Define Timeframe Range</label>
              <div className="quick-ranges">
                <button type="button" className={`range-btn ${quickRange === '24h' ? 'active' : ''}`} onClick={() => applyQuickRange('24h')}>Last 24 Hours</button>
                <button type="button" className={`range-btn ${quickRange === '7d' ? 'active' : ''}`} onClick={() => applyQuickRange('7d')}>Last 7 Days</button>
                <button type="button" className={`range-btn ${quickRange === '30d' ? 'active' : ''}`} onClick={() => applyQuickRange('30d')}>Last 30 Days</button>
                <button type="button" className={`range-btn ${quickRange === 'custom' ? 'active' : ''}`} onClick={() => setQuickRange('custom')}>Custom Range</button>
              </div>

              <div className="date-inputs">
                <div className="form-group">
                  <label htmlFor="startDate" style={{ fontSize: '0.8rem' }}>Start Date & Time</label>
                  <input type="datetime-local" id="startDate" value={startDate} onChange={(e) => handleDateChange('start', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate" style={{ fontSize: '0.8rem' }}>End Date & Time</label>
                  <input type="datetime-local" id="endDate" value={endDate} onChange={(e) => handleDateChange('end', e.target.value)} required />
                </div>
              </div>
            </div>

            {/* CHANGED SECTION: Updated from Static Text into an Interactive Dropdown Selection Field */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label htmlFor="reportFormat">3. Choose Download Format</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <select 
                  id="reportFormat"
                  value={format} 
                  onChange={(e) => setFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    background: 'var(--bg-surface, #fff)',
                    color: 'var(--text-main, #2d3748)',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    appearance: 'none',
                    fontWeight: '500'
                  }}
                >
                  <option value="pdf">Adobe Portable Document Format (.pdf)</option>
                  <option value="csv">Comma-Separated Values (.csv)</option>
                </select>
                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  {format === 'pdf' ? (
                    <FileText size={18} style={{ color: '#e53e3e' }} />
                  ) : (
                    <FileSpreadsheet size={18} style={{ color: '#38a169' }} />
                  )}
                </div>
              </div>
            </div>

            <div className="generate-actions">
              <button type="submit" className="btn btn-primary btn-generate" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-sm"></div>
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Generate & Download</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Download History Panel */}
        <div className="glass-card history-container" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History className="text-secondary" size={22} />
              Recent Downloads
            </h2>
            {history.length > 0 && (
              <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Clear All
              </button>
            )}
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">
                <FileSpreadsheet size={40} style={{ opacity: 0.2 }} />
                <p>No recent reports downloaded.</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generated reports will appear here for quick access.</span>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="glass-panel history-card">
                  <div className="history-meta">
                    <div className="history-title">
                      {item.type === 'telemetry' ? (
                        <>
                          <Activity size={16} className="text-primary" />
                          <span>Telemetry ({item.format ? item.format.toUpperCase() : 'CSV'})</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} className="text-accent" />
                          <span>Alerts ({item.format ? item.format.toUpperCase() : 'CSV'})</span>
                        </>
                      )}
                    </div>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="history-details">
                    <div>
                      <span className="text-muted">Start: </span> 
                      <span style={{ color: 'var(--text-secondary)' }}>{formatDisplayDate(item.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-muted">End: </span> 
                      <span style={{ color: 'var(--text-secondary)' }}>{formatDisplayDate(item.endDate)}</span>
                    </div>
                    <div className="history-time">{item.timestamp}</div>
                  </div>

                  {item.status === 'success' && (
                    <div className="history-actions">
                      <button className="history-redownload-btn" onClick={() => handleReDownload(item)} disabled={loading}>
                        <Download size={13} />
                        <span>Re-download</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;