import React, { useState, useEffect } from 'react';
import { getSensors, createSensor, updateSensor, deleteSensor, getSites, getSensorTypes } from '../../services/mockData';
import { Modal } from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, RadioReceiver } from 'lucide-react';
import './Crud.css';

const Sensors = () => {
  const [sensors, setSensors] = useState([]);
  const [sites, setSites] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSensor, setCurrentSensor] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ 
    sensor_type_id: '', 
    site_id: '', 
    longitude: '',
    latitude: '',
    unit_of_measure: '',
    threshold_low_warning: '', 
    threshold_low_critical: '',
    threshold_high_warning: '', 
    threshold_high_critical: '' 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sens, sts, typs] = await Promise.all([getSensors(), getSites(), getSensorTypes()]);
      setSensors(sens);
      setSites(sts);
      setTypes(typs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (sensor = null) => {
    if (sensor) {
      setCurrentSensor(sensor);
      setFormData({ 
        sensor_type_id: sensor.sensor_type_id, 
        site_id: sensor.site_id, 
        longitude: sensor.longitude,
        latitude: sensor.latitude,
        unit_of_measure: sensor.unit_of_measure,
        threshold_low_warning: sensor.threshold_low_warning,
        threshold_low_critical: sensor.threshold_low_critical,
        threshold_high_warning: sensor.threshold_high_warning,
        threshold_high_critical: sensor.threshold_high_critical
      });
    } else {
      setCurrentSensor(null);
      setFormData({ 
        sensor_type_id: types.length ? types[0].sensor_type_id : '', 
        site_id: sites.length ? sites[0].site_id : '', 
        longitude: '',
        latitude: '',
        unit_of_measure: '',
        threshold_low_warning: '', 
        threshold_low_critical: '',
        threshold_high_warning: '', 
        threshold_high_critical: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSensor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      longitude: Number(formData.longitude),
      latitude: Number(formData.latitude),
      threshold_low_warning: Number(formData.threshold_low_warning),
      threshold_low_critical: Number(formData.threshold_low_critical),
      threshold_high_warning: Number(formData.threshold_high_warning),
      threshold_high_critical: Number(formData.threshold_high_critical),
    };

    if (currentSensor) {
      await updateSensor(currentSensor.sensor_id, payload);
    } else {
      await createSensor(payload);
    }
    handleCloseModal();
    fetchData(); // Just refetching all to be safe though we only need sensors
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sensor?')) {
      await deleteSensor(id);
      fetchData();
    }
  };

  const getSiteName = (id) => sites.find(s => s.site_id === id)?.site_name || id;
  const getTypeName = (id) => types.find(t => t.sensor_type_id === id)?.type || id;

  return (
    <div className="page-enter crud-page">
      <header className="crud-header">
        <div>
          <h1>Sensors Inventory</h1>
          <p>Register sensors and configure alert thresholds.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Sensor
        </button>
      </header>

      <div className="glass-card crud-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sensors network...</p>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                <th>Sensor ID</th>
                <th>Type</th>
                <th>Site Location</th>
                <th>Unit</th>
                <th>Low/Hi Warn</th>
                <th>Low/Hi Crit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map(sensor => (
                <tr key={sensor.sensor_id} className="crud-row">
                  <td className="font-mono text-white font-medium">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <RadioReceiver size={16} className="text-muted" />
                      {sensor.sensor_id}
                    </div>
                  </td>
                  <td>{getTypeName(sensor.sensor_type_id)}</td>
                  <td>{getSiteName(sensor.site_id)}</td>
                  <td>{sensor.unit_of_measure}</td>
                  <td className="font-mono text-muted">{sensor.threshold_low_warning} / {sensor.threshold_high_warning}</td>
                  <td className="font-mono text-muted">{sensor.threshold_low_critical} / {sensor.threshold_high_critical}</td>
                  <td className="actions-cell">
                    <button className="action-btn edit" onClick={() => handleOpenModal(sensor)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(sensor.sensor_id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sensors.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state" style={{ padding: '2rem' }}>No sensors deployed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={currentSensor ? "Edit Sensor" : "Deploy New Sensor"}
      >
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Sensor Type</label>
            <select 
              required
              value={formData.sensor_type_id} 
              onChange={e => setFormData({...formData, sensor_type_id: e.target.value})}
            >
              {types.map(t => <option key={t.sensor_type_id} value={t.sensor_type_id}>{t.type}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Deployment Site</label>
            <select 
              required
              value={formData.site_id} 
              onChange={e => setFormData({...formData, site_id: e.target.value})}
            >
              {sites.map(s => <option key={s.site_id} value={s.site_id}>{s.site_name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Longitude</label>
              <input 
                required type="number" step="any"
                value={formData.longitude} 
                onChange={e => setFormData({...formData, longitude: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Latitude</label>
              <input 
                required type="number" step="any"
                value={formData.latitude} 
                onChange={e => setFormData({...formData, latitude: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Unit of Measure</label>
            <input 
              required type="text"
              value={formData.unit_of_measure} 
              onChange={e => setFormData({...formData, unit_of_measure: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Low Critical</label>
              <input 
                required type="number" step="any"
                value={formData.threshold_low_critical} 
                onChange={e => setFormData({...formData, threshold_low_critical: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Low Warning</label>
              <input 
                required type="number" step="any"
                value={formData.threshold_low_warning} 
                onChange={e => setFormData({...formData, threshold_low_warning: e.target.value})}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>High Warning</label>
              <input 
                required type="number" step="any"
                value={formData.threshold_high_warning} 
                onChange={e => setFormData({...formData, threshold_high_warning: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>High Critical</label>
              <input 
                required type="number" step="any"
                value={formData.threshold_high_critical} 
                onChange={e => setFormData({...formData, threshold_high_critical: e.target.value})}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {currentSensor ? "Save Changes" : "Deploy Sensor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sensors;
