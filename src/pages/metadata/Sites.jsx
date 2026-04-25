import React, { useState, useEffect } from 'react';
import { getSites, createSite, updateSite, deleteSite, getSiteById } from '../../services/siteService';
import { Modal } from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, MapPin, Eye, Search } from 'lucide-react';
import './Crud.css';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(null); // null means "Create", object means "Edit"
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewSiteData, setViewSiteData] = useState(null);

  const [searchId, setSearchId] = useState('');

  // Form State
  const [formData, setFormData] = useState({ siteName: '', location: '' });

  const fetchSites = async () => {
    setLoading(true);
    try {
      const data = await getSites();
      setSites(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSites([]);
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
      setFormData({ siteName: site.siteName, location: site.location });
    } else {
      setCurrentSite(null);
      setFormData({ siteName: '', location: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSite(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      fetchSites();
      return;
    }
    setLoading(true);
    try {
      const data = await getSiteById(searchId);
      // Backend might return an empty object or null if not found, or throw an error (404)
      if (data && data.siteId) {
        setSites([data]);
      } else {
        setSites([]);
      }
    } catch (err) {
      console.error("Failed to search site:", err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await getSiteById(id);
      setViewSiteData(data);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error("Failed to view site:", err);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      siteName: formData.siteName,
      location: formData.location
    };

    if (currentSite) {
      await updateSite(currentSite.siteId, payload);
    } else {
      await createSite(payload);
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
            <Plus size={18} /> Add Site
          </button>
        </div>
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
                <tr key={site.siteId} className="crud-row">
                  <td className="font-mono text-muted">{site.siteId}</td>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} className="text-muted" />
                      {site.siteName}
                    </div>
                  </td>
                  <td className="font-mono text-muted" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={site.location}>
                    {site.location}
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn view" onClick={() => handleView(site.siteId)} title="View">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn edit" onClick={() => handleOpenModal(site)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(site.siteId)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sites.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                    No sites found.
                  </td>
                </tr>
              )}
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
              value={formData.siteName}
              onChange={e => setFormData({ ...formData, siteName: e.target.value })}
              placeholder="e.g. North Pipeline Sector A"
            />
          </div>
          <div className="form-group">
            <label>Location (Polygon)</label>
            <input
              required
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
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

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Site Details"
      >
        {viewSiteData ? (
          <div style={{ padding: '1rem', lineHeight: '1.6' }}>
            <p><strong>Site ID:</strong> {viewSiteData.siteId}</p>
            <p><strong>Site Name:</strong> {viewSiteData.siteName}</p>
            <p style={{ wordBreak: 'break-all' }}><strong>Location:</strong> {viewSiteData.location}</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
            </div>
          </div>
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading site details...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sites;
