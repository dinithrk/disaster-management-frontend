import React, { useState, useEffect } from 'react';
import { getSensorTypes, createSensorType, updateSensorType, deleteSensorType } from '../../services/mockData';
import { Modal } from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, Activity } from 'lucide-react';
import './Crud.css';

const SensorTypes = () => {
  const [sensorTypes, setSensorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ type: '' });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await getSensorTypes();
      setSensorTypes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenModal = (type = null) => {
    if (type) {
      setCurrentType(type);
      setFormData({ type: type.type });
    } else {
      setCurrentType(null);
      setFormData({ type: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentType) {
      await updateSensorType(currentType.sensor_type_id, formData);
    } else {
      await createSensorType(formData);
    }
    handleCloseModal();
    fetchTypes();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sensor type?')) {
      await deleteSensorType(id);
      fetchTypes();
    }
  };

  return (
    <div className="page-enter crud-page">
      <header className="crud-header">
        <div>
          <h1>Sensor Types</h1>
          <p>Define categories, units, and specifications for sensors.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Type
        </button>
      </header>

      <div className="glass-card crud-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sensor types...</p>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                <th>Type ID</th>
                <th>Sensor Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sensorTypes.map(type => (
                <tr key={type.sensor_type_id} className="crud-row">
                  <td className="font-mono text-muted">{type.sensor_type_id}</td>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} className="text-muted" />
                      {type.type}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn edit" onClick={() => handleOpenModal(type)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(type.sensor_type_id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={currentType ? "Edit Sensor Type" : "Add New Sensor Type"}
      >
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Sensor Type</label>
            <input 
              required
              type="text" 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
              placeholder="e.g. Temperature Pro"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {currentType ? "Save Changes" : "Create Type"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SensorTypes;
