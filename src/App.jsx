import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';

// Page Placeholders
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Sites from './pages/metadata/Sites';
import SensorTypes from './pages/metadata/SensorTypes';
import Sensors from './pages/metadata/Sensors';

import './App.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/metadata/sites" element={<Sites />} />
          <Route path="/metadata/sensor-types" element={<SensorTypes />} />
          <Route path="/metadata/sensors" element={<Sensors />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
