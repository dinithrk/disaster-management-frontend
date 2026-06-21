import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, MapPin, Activity, RadioReceiver, LineChart, Globe } from 'lucide-react';
import { useSystemStatus } from '../../context/SystemStatusContext';
import './Sidebar.css';

const Sidebar = () => {
  const { isOnline } = useSystemStatus();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/gis-dashboard', icon: Globe, label: 'GIS Monitor' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { path: '/metadata/sites', icon: MapPin, label: 'Sites' },
    { path: '/metadata/sensor-types', icon: Activity, label: 'Sensor Types' },
    { path: '/metadata/sensors', icon: RadioReceiver, label: 'Sensors' },
    { path: '/telemetry-data', icon: LineChart, label: 'Telemetry Data' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon glass-card" />
          <h2>A.T.L.A.S.<br />Response</h2>
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
