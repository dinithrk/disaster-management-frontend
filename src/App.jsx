import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Sidebar from './components/Layout/Sidebar';
import { SystemStatusProvider } from './context/SystemStatusContext';
import { AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Page Placeholders
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Sites from './pages/metadata/Sites';
import SensorTypes from './pages/metadata/SensorTypes';
import Sensors from './pages/metadata/Sensors';
import TelemetryData from './pages/TelemetryData';
import GisDashboard from './pages/GisDashboard';
import Reports from './pages/Reports';

// Auth Pages
import Login from './pages/auth/Login';
import Profile from './pages/user/Profile';
import UserManagement from './pages/admin/UserManagement';

import './App.css';

function App() {
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const toggleTheme = () => setIsLightMode(!isLightMode);

  return (
    <ConfigProvider
      theme={{
        algorithm: isLightMode ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6', // Matching --accent-blue
          colorBgContainer: isLightMode ? '#ffffff' : '#1f222d',
          colorBgElevated: isLightMode ? '#ffffff' : '#2a2e3d',
        },
      }}
    >
      <SystemStatusProvider>
        <div className="app-container">
          {isAuthenticated && <Sidebar toggleTheme={toggleTheme} isLightMode={isLightMode} />}
          <main className={`main-content ${!isAuthenticated ? 'full-width' : ''}`}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/metadata/sites" element={<Sites />} />
                <Route path="/metadata/sensor-types" element={<SensorTypes />} />
                <Route path="/metadata/sensors" element={<Sensors />} />
                <Route path="/telemetry-data" element={<TelemetryData />} />
                <Route path="/gis-dashboard" element={<GisDashboard />} />
                <Route path="/gis" element={<GisDashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>
            </Routes>
          </main>
        </div>
      </SystemStatusProvider>
    </ConfigProvider>
  );
}

export default App;
