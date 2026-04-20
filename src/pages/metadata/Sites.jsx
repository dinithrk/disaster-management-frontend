import React, { useState, useEffect } from 'react';
import { getSites, createSite, updateSite, deleteSite } from '../../services/mockData';
import { Modal } from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import './Crud.css';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null); // null means "Create", object means "Edit"
  
  // Form State
  const [formData, setFormData] = useState({ site_name: '', location: '' });

  const fetchSites = async () => {
    setLoading(true);
    try {
      const data = await getSites();
      setSites(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleOpenModal = (site = null) => {
    if (site) {
      setCurrentSite(site);
      setFormData({ site_name: site.site_name, location: site.location });
    } else {
      setCurrentSite(null);
      setFormData({ site_name: '', location: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSite(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentSite) {
      await updateSite(currentSite.site_id, formData);
    } else {
      await createSite(formData);
    }
    handleCloseModal();
    fetchSites();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      await deleteSite(id);
      fetchSites();
    }
  };

  return (
    <div className="page-enter crud-page">
      <header className="crud-header">
        <div>
          <h1>Manage Sites</h1>
          <p>Configure locations for sensor deployments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Site
        </button>
      </header>

      <div className="glass-card crud-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sites...</p>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Site Name</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map(site => (
                <tr key={site.site_id} className="crud-row">
                  <td className="font-mono text-muted">{site.site_id}</td>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} className="text-muted" />
                      {site.site_name}
                    </div>
                  </td>
                  <td className="font-mono text-muted" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={site.location}>
                    {site.location}
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn edit" onClick={() => handleOpenModal(site)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(site.site_id)} title="Delete">
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
        title={currentSite ? "Edit Site" : "Add New Site"}
      >
        <form onSubmit={handleSubmit} className="crud-form">
          <div className="form-group">
            <label>Site Name</label>
            <input 
              required
              type="text" 
              value={formData.site_name} 
              onChange={e => setFormData({...formData, site_name: e.target.value})}
              placeholder="e.g. North Pipeline Sector A"
            />
          </div>
          <div className="form-group">
            <label>Location (Polygon)</label>
            <input 
              required
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="e.g. POLYGON((0 0, 0 10, ...))"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {currentSite ? "Save Changes" : "Create Site"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sites;
