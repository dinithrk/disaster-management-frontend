import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, MapPin, Activity, RadioReceiver, LineChart, Globe, FileSpreadsheet, Sun, Moon, Settings } from 'lucide-react';
import { useSystemStatus } from '../../context/SystemStatusContext';
import './Sidebar.css';

const Sidebar = ({ toggleTheme, isLightMode }) => {
  const { isOnline } = useSystemStatus();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/gis-dashboard', icon: Globe, label: 'GIS Monitor' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { path: '/metadata/sites', icon: MapPin, label: 'Sites' },
    { path: '/metadata/sensor-types', icon: Activity, label: 'Sensor Types' },
    { path: '/metadata/sensors', icon: RadioReceiver, label: 'Sensors' },
    { path: '/telemetry-data', icon: LineChart, label: 'Telemetry Data' },
    { path: '/reports', icon: FileSpreadsheet, label: 'Reports' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo-container">
          <img src="/atlas-logo.png" alt="ATLAS Logo" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
          <h2>A.T.L.A.S.<br />Response</h2>
        </div>
        <div className="settings-container" style={{ position: 'relative' }} ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="settings-btn" 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Settings"
          >
            <Settings size={20} style={{ transition: 'transform 0.3s', transform: showSettings ? 'rotate(90deg)' : 'rotate(0deg)' }} />
          </button>
          {showSettings && (
            <div className="settings-dropdown glass-panel" style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              marginTop: '0.5rem', 
              padding: '0.5rem', 
              borderRadius: '8px',
              minWidth: '160px',
              zIndex: 100,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--glass-card-shadow)'
            }}>
              <button 
                onClick={() => { toggleTheme(); setShowSettings(false); }} 
                className="theme-toggle-dropdown"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  width: '100%', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
                <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span 
            className={`status-indicator ${isOnline ? 'active animate-pulse-glow' : ''}`} 
            style={{ backgroundColor: isOnline ? 'var(--severity-success)' : 'var(--severity-critical, #ef4444)' }}
          ></span>
          <span className="status-text">{isOnline ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
