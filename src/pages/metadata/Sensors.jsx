import React, { useState, useEffect } from 'react';
import { getSensors, createSensor, updateSensor, deleteSensor, getSensorById } from '../../services/sensorService';
import { getSites } from '../../services/siteService';
import { getSensorTypes } from '../../services/sensorTypeService';
import { Modal } from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, RadioReceiver, Eye, Search } from 'lucide-react';
import './Crud.css';

const Sensors = () => {
    const [sensors, setSensors] = useState([]);
    const [sites, setSites] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSensor, setCurrentSensor] = useState(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewSensorData, setViewSensorData] = useState(null);

    const [searchId, setSearchId] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        sensorId: '',
        sensorTypeId: '',
        siteId: '',
        longitude: '',
        latitude: '',
        unitOfMeasure: '',
        thresholdLowWarning: '',
        thresholdLowCritical: '',
        thresholdHighWarning: '',
        thresholdHighCritical: ''
    });

    const fetchData = async () => {
        setLoading(true);

        try {
            const [sens, sts, typs] = await Promise.all([
                getSensors(),
                getSites(),
                getSensorTypes()
            ]);

            console.log("🔥 SENSORS API:", sens);
            console.log("🔥 SITES API:", sts);
            console.log("🔥 TYPES API:", typs);

            setSensors(Array.isArray(sens) ? sens : []);
            setSites(Array.isArray(sts) ? sts : []);
            setTypes(Array.isArray(typs) ? typs : []);

        } catch (e) {
            console.error(e);
            setSensors([]);
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
                sensorId: sensor.sensorId || sensor.sensor_id || '',
                sensorTypeId: sensor.sensorType?.sensorTypeId || sensor.sensorType?.sensor_type_id || sensor.sensor_type_id || '',
                siteId: sensor.site?.siteId || sensor.site?.site_id || sensor.site_id || '',
                longitude: sensor.longitude,
                latitude: sensor.latitude,
                unitOfMeasure: sensor.unitOfMeasure || sensor.unit_of_measure,
                thresholdLowWarning: sensor.thresholdLowWarning || sensor.threshold_low_warning,
                thresholdLowCritical: sensor.thresholdLowCritical || sensor.threshold_low_critical,
                thresholdHighWarning: sensor.thresholdHighWarning || sensor.threshold_high_warning,
                thresholdHighCritical: sensor.thresholdHighCritical || sensor.threshold_high_critical
            });
        } else {
            setCurrentSensor(null);
            setFormData({
                sensorId: '',
                sensorTypeId: types.length ? (types[0].sensorTypeId || types[0].sensor_type_id) : 0,
                siteId: sites.length ? (sites[0].siteId || sites[0].site_id) : 0,
                longitude: '',
                latitude: '',
                unitOfMeasure: '',
                thresholdLowWarning: '',
                thresholdLowCritical: '',
                thresholdHighWarning: '',
                thresholdHighCritical: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSensor(null);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) {
            fetchData();
            return;
        }
        setLoading(true);
        try {
            const allSensors = await getSensors();
            const sensArray = Array.isArray(allSensors) ? allSensors : [];
            const filtered = sensArray.filter(s => {
                const sid = s.sensorId || s.sensor_id;
                return sid ? String(sid).toLowerCase().includes(searchId.toLowerCase()) : false;
            });
            setSensors(filtered);
        } catch (err) {
            console.error("Failed to search sensor:", err);
            setSensors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (id) => {
        try {
            const data = await getSensorById(id);
            setViewSensorData(data);
            setIsViewModalOpen(true);
        } catch (err) {
            console.error("Failed to view sensor:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            sensorId: formData.sensorId,
            sensorType: { sensorTypeId: Number(formData.sensorTypeId) },
            site: { siteId: Number(formData.siteId) },
            longitude: Number(formData.longitude),
            latitude: Number(formData.latitude),
            unitOfMeasure: formData.unitOfMeasure,
            thresholdLowWarning: Number(formData.thresholdLowWarning),
            thresholdLowCritical: Number(formData.thresholdLowCritical),
            thresholdHighWarning: Number(formData.thresholdHighWarning),
            thresholdHighCritical: Number(formData.thresholdHighCritical),
        };

        try {
            if (currentSensor) {
                const targetId = currentSensor.sensorId || currentSensor.sensor_id;
                await updateSensor(targetId, payload);
            } else {
                await createSensor(payload);
            }
            handleCloseModal();
            fetchData(); // Refetch to show new data
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Error saving sensor: " + (err.response?.data?.message || err.message || "Unknown error"));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this sensor?')) {
            await deleteSensor(id);
            fetchData();
        }
    };


    const getSiteName = (id) =>
        sites.find(s => Number(s.siteId) === Number(id))?.siteName || id;

    const getTypeName = (id) =>
        types.find(t => Number(t.sensorTypeId) === Number(id))?.type || id;

    return (
        <div className="page-enter crud-page">
            <header className="crud-header">
                <div>
                    <h1>Sensors Inventory</h1>
                    <p>Register sensors and configure alert thresholds.</p>
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
                        <Plus size={18} /> Add Sensor
                    </button>
                </div>
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
                                <tr key={sensor.sensorId} className="crud-row">
                                    <td className="font-mono text-white font-medium">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <RadioReceiver size={16} className="text-muted" />
                                            {sensor.sensorId}
                                        </div>
                                    </td>
                                    <td>{getTypeName(sensor.sensorType?.sensorTypeId)}</td>
                                    <td>{getSiteName(sensor.site?.siteId)}</td>
                                    <td>{sensor.unitOfMeasure}</td>
                                    <td className="font-mono text-muted">{sensor.thresholdLowWarning} / {sensor.thresholdHighWarning}</td>
                                    <td className="font-mono text-muted">{sensor.thresholdLowCritical} / {sensor.thresholdHighCritical}</td>
                                    <td className="actions-cell">
                                        <button className="action-btn view" onClick={() => handleView(sensor.sensorId)} title="View">
                                            <Eye size={16} />
                                        </button>
                                        <button className="action-btn edit" onClick={() => handleOpenModal(sensor)} title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(sensor.sensorId)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sensors.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No sensors found.</td>
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
                        <label>Sensor ID</label>
                        <input
                            required type="text"
                            value={formData.sensorId}
                            onChange={e => setFormData({ ...formData, sensorId: e.target.value })}
                            disabled={!!currentSensor}
                        />
                    </div>
                    <div className="form-group">
                        <label>Sensor Type</label>
                        <select
                            required
                            value={formData.sensorTypeId}
                            onChange={e =>
                                setFormData({ ...formData, sensorTypeId: Number(e.target.value) })
                            }
                        >
                            {types.map(t => {
                                const tId = t.sensorTypeId || t.sensor_type_id;
                                return <option key={tId} value={tId}>{t.type}</option>
                            })}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Deployment Site</label>
                        <select
                            required
                            value={formData.siteId}
                            onChange={e =>
                                setFormData({ ...formData, siteId: Number(e.target.value) })
                            }
                        >
                            {sites.map(s => {
                                const sId = s.siteId || s.site_id;
                                return <option key={sId} value={sId}>{s.siteName || s.site_name}</option>
                            })}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Longitude</label>
                            <input
                                required type="number" step="any"
                                value={formData.longitude}
                                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Latitude</label>
                            <input
                                required type="number" step="any"
                                value={formData.latitude}
                                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Unit of Measure</label>
                        <input
                            required type="text"
                            value={formData.unitOfMeasure}
                            onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Low Critical</label>
                            <input
                                required type="number" step="any"
                                value={formData.thresholdLowCritical}
                                onChange={e => setFormData({ ...formData, thresholdLowCritical: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Low Warning</label>
                            <input
                                required type="number" step="any"
                                value={formData.thresholdLowWarning}
                                onChange={e => setFormData({ ...formData, thresholdLowWarning: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>High Warning</label>
                            <input
                                required type="number" step="any"
                                value={formData.thresholdHighWarning}
                                onChange={e => setFormData({ ...formData, thresholdHighWarning: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>High Critical</label>
                            <input
                                required type="number" step="any"
                                value={formData.thresholdHighCritical}
                                onChange={e => setFormData({ ...formData, thresholdHighCritical: e.target.value })}
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

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Sensor Details"
            >
                {viewSensorData ? (
                    <div style={{ padding: '1rem', lineHeight: '1.6' }}>
                        <p><strong>Sensor ID:</strong> {viewSensorData.sensorId}</p>
                        <p><strong>Sensor Type:</strong> {viewSensorData.sensorType?.type || getTypeName(viewSensorData.sensorType?.sensorTypeId)}</p>
                        <p><strong>Site Location:</strong> {viewSensorData.site?.siteName || getSiteName(viewSensorData.site?.siteId)}</p>
                        <p><strong>Coordinates:</strong> {viewSensorData.latitude}, {viewSensorData.longitude}</p>
                        <p><strong>Unit of Measure:</strong> {viewSensorData.unitOfMeasure}</p>
                        <p><strong>Low Critical/Warning:</strong> {viewSensorData.thresholdLowCritical} / {viewSensorData.thresholdLowWarning}</p>
                        <p><strong>High Warning/Critical:</strong> {viewSensorData.thresholdHighWarning} / {viewSensorData.thresholdHighCritical}</p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
                        </div>
                    </div>
                ) : (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading sensor details...</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Sensors;
