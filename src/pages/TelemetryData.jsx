import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MapPin, Activity } from 'lucide-react';
import './TelemetryData.css';

const dummyData = [
  { time: '00:00', level: 2.1 },
  { time: '02:00', level: 2.3 },
  { time: '04:00', level: 2.8 },
  { time: '06:00', level: 4.5 },
  { time: '08:00', level: 6.2 },
  { time: '10:00', level: 7.5 },
  { time: '12:00', level: 8.4 },
  { time: '14:00', level: 8.1 },
  { time: '16:00', level: 7.0 },
  { time: '18:00', level: 5.5 },
  { time: '20:00', level: 4.0 },
  { time: '22:00', level: 3.2 },
];

const TelemetryData = () => {
  return (
    <div className="telemetry-page">
      <div className="page-header">
        <h1>Telemetry Data</h1>
        <p className="subtitle">Real-time water level monitoring and location tracking</p>
      </div>

      <div className="telemetry-grid">
        {/* Map Section */}
        <div className="glass-card map-container">
          <div className="card-header">
            <MapPin className="header-icon text-primary" size={24} />
            <h2>Sensor Location</h2>
          </div>
          <div className="map-wrapper">
            <iframe
              src="https://maps.google.com/maps?q=Mahaweli%20river,%20Sri%20Lanka&t=&z=10&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Sensor Location Map"
            ></iframe>
          </div>
          <div className="card-footer">
            <span className="location-details">📍 Mahaweli River, Sri Lanka (Station ID: MR-001)</span>
          </div>
        </div>

        {/* Chart Section */}
        <div className="glass-card chart-container">
          <div className="card-header">
            <Activity className="header-icon text-accent" size={24} />
            <h2>Water Level Readings (24h)</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dummyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                <YAxis 
                  stroke="rgba(255,255,255,0.7)"
                  label={{ value: 'Water Level (m)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
                  domain={[0, 10]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 15, 30, 0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                {/* Reference Lines for Thresholds */}
                <ReferenceLine y={8} label={{ position: 'top', value: 'High Critical (8m)', fill: '#ef4444', fontSize: 12 }} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={6} label={{ position: 'top', value: 'High Warning (6m)', fill: '#f97316', fontSize: 12 }} stroke="#f97316" strokeDasharray="3 3" />
                <ReferenceLine y={2} label={{ position: 'bottom', value: 'Low Warning (2m)', fill: '#eab308', fontSize: 12 }} stroke="#eab308" strokeDasharray="3 3" />
                <ReferenceLine y={1} label={{ position: 'bottom', value: 'Low Critical (1m)', fill: '#ef4444', fontSize: 12 }} stroke="#ef4444" strokeDasharray="3 3" />

                <Line 
                  type="monotone" 
                  dataKey="level" 
                  name="Water Level"
                  stroke="var(--color-primary, #3b82f6)" 
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: 'var(--color-accent, #8b5cf6)' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card-footer">
            <span className="status-indicator active animate-pulse-glow" style={{ backgroundColor: 'var(--severity-critical, #ef4444)' }}></span>
            <span className="status-text text-critical">Status: High Critical (Last reading: 3.2m)</span>
            <span className="last-updated">Updated: Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryData;
