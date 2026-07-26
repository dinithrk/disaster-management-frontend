import React, { useState, useEffect } from 'react';
import { getSensorTypes, createSensorType, updateSensorType, deleteSensorType, getSensorTypeById } from '../../services/sensorTypeService';
import { Modal } from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, Activity, Eye, Search } from 'lucide-react';
import ConnectionError from '../../components/UI/ConnectionError';
import { useSystemStatus } from '../../context/SystemStatusContext';
import './Crud.css';

const SensorTypes = () => {
  const [sensorTypes, setSensorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setOnlineStatus } = useSystemStatus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTypeData, setViewTypeData] = useState(null);

  const [searchId, setSearchId] = useState('');

  // Form State
  const [formData, setFormData] = useState({ type: '' });


  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://localhost:8092/sensor-types");
      const data = await res.json();

      console.log("RAW API:", data);

      setSensorTypes(Array.isArray(data) ? data : []);
      setOnlineStatus(true);
    } catch (err) {
      console.error("Failed to fetch sensor types:", err);
      setSensorTypes([]);
      setError("Failed to connect. The server or database might be down. Please try again later.");
      setOnlineStatus(false);
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      fetchTypes();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSensorTypeById(searchId);
      if (data && data.sensorTypeId) {
        setSensorTypes([data]);
      } else {
        setSensorTypes([]);
      }
      setOnlineStatus(true);
    } catch (err) {
      console.error("Failed to search sensor type:", err);
      setSensorTypes([]);
      setError("Search failed. The server or database might be down. Please try again.");
      setOnlineStatus(false);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await getSensorTypeById(id);
      setViewTypeData(data);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error("Failed to view sensor type:", err);
      alert("Error viewing sensor type: " + (err.response?.data?.message || err.message || "Unknown error"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentType) {
        await updateSensorType(currentType.sensorTypeId, formData);
      } else {
        await createSensorType(formData);
      }
      handleCloseModal();
      fetchTypes();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Error saving sensor type: " + (err.response?.data?.message || err.message || "Unknown error"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sensor type?')) {
      try {
        await deleteSensorType(id);
        fetchTypes();
      } catch (err) {
        alert("Error deleting sensor type: " + (err.response?.data?.message || err.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="page-enter crud-page">
      <header className="crud-header">
        <div>
          <h1>Sensor Types</h1>
          <p>Define categories, units, and specifications for sensors.</p>
        </div>
        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-container">
            <input
              type="text"
              placeholder="Search by ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button type="submit" title="Search">
              <Search size={16} />
            </button>
          </form>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Type
          </button>
        </div>
      </header>

      {error ? (
        <ConnectionError 
            message="This site can't be reached" 
            subMessage={error} 
            errorCode="ERR_CONNECTION_REFUSED" 
            onReload={fetchTypes} 
        />
      ) : (
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
                <tr key={type.sensorTypeId} className="crud-row">
                  <td className="font-mono text-muted">{type.sensorTypeId}</td>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} className="text-muted" />
                      {type.type}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn view" onClick={() => handleView(type.sensorTypeId)} title="View">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn edit" onClick={() => handleOpenModal(type)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(type.sensorTypeId)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sensorTypes.length === 0 && (
                <tr>
                  <td colSpan="3" className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                    No sensor types found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      )}

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
              onChange={e => setFormData({ ...formData, type: e.target.value })}
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

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sensor Type Details"
      >
        {viewTypeData ? (
          <div style={{ padding: '1rem', lineHeight: '1.6' }}>
            <p><strong>Type ID:</strong> {viewTypeData.sensorTypeId}</p>
            <p><strong>Sensor Type:</strong> {viewTypeData.type}</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
            </div>
          </div>
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sensor type details...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SensorTypes;
