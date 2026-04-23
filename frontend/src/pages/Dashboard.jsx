import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    type: 'Lost',
    location: '',
    date: '',
    contactInfo: ''
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchItems();
    }
  }, [navigate]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items', getHeaders());
      setItems(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError('Failed to fetch items');
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://localhost:5000/api/items/search?name=${searchQuery}&type=${searchType}`, getHeaders());
      setItems(res.data);
    } catch (err) {
      setError('Search failed');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchType('');
    fetchItems();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/items/${editId}`, formData, getHeaders());
        setMessage('Item updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/items', formData, getHeaders());
        setMessage('Item added successfully');
      }
      setFormData({ itemName: '', description: '', type: 'Lost', location: '', date: '', contactInfo: '' });
      setEditId(null);
      fetchItems();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      setMessage('');
    }
  };

  const handleEditClick = (item) => {
    setEditId(item._id);
    setFormData({
      itemName: item.itemName,
      description: item.description,
      type: item.type,
      location: item.location,
      date: item.date.split('T')[0], // format date for input field
      contactInfo: item.contactInfo
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`, getHeaders());
      setMessage('Item deleted successfully');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Lost & Found Dashboard</h2>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">{editId ? 'Edit Item' : 'Add New Item'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleFormSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Item Name</label>
                <input type="text" name="itemName" className="form-control" value={formData.itemName} onChange={handleFormChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Type</label>
                <select name="type" className="form-select" value={formData.type} onChange={handleFormChange} required>
                  <option value="Lost">Lost</option>
                  <option value="Found">Found</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" rows="2" value={formData.description} onChange={handleFormChange} required></textarea>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Location</label>
                <input type="text" name="location" className="form-control" value={formData.location} onChange={handleFormChange} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Date</label>
                <input type="date" name="date" className="form-control" value={formData.date} onChange={handleFormChange} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Contact Info</label>
                <input type="text" name="contactInfo" className="form-control" value={formData.contactInfo} onChange={handleFormChange} required />
              </div>
            </div>
            <button type="submit" className="btn btn-success me-2">{editId ? 'Update Item' : 'Add Item'}</button>
            {editId && (
              <button type="button" className="btn btn-secondary" onClick={() => {
                setEditId(null);
                setFormData({ itemName: '', description: '', type: 'Lost', location: '', date: '', contactInfo: '' });
              }}>Cancel Edit</button>
            )}
          </form>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">Search Items</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label">Item Name</label>
              <input type="text" className="form-control" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Type</label>
              <select className="form-select" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                <option value="">All Types</option>
                <option value="Lost">Lost</option>
                <option value="Found">Found</option>
              </select>
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-primary me-2 w-100 mb-2">Search</button>
              <button type="button" className="btn btn-outline-secondary w-100" onClick={clearSearch}>Clear</button>
            </div>
          </form>
        </div>
      </div>

      <h4 className="mb-3">Item Listings</h4>
      {items.length === 0 ? (
        <p className="text-muted">No items found.</p>
      ) : (
        <div className="row">
          {items.map(item => (
            <div className="col-md-6 col-lg-4 mb-4" key={item._id}>
              <div className={`card h-100 border-${item.type === 'Lost' ? 'danger' : 'success'}`}>
                <div className={`card-header text-white bg-${item.type === 'Lost' ? 'danger' : 'success'}`}>
                  <h5 className="mb-0">{item.type}: {item.itemName}</h5>
                </div>
                <div className="card-body">
                  <p className="card-text"><strong>Description:</strong> {item.description}</p>
                  <p className="card-text mb-1"><strong>Location:</strong> {item.location}</p>
                  <p className="card-text mb-1"><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
                  <p className="card-text mb-1"><strong>Contact:</strong> {item.contactInfo}</p>
                  <p className="card-text mt-3"><small className="text-muted">Posted by: {item.createdBy?.name || 'Unknown'}</small></p>
                </div>
                <div className="card-footer bg-transparent">
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditClick(item)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(item._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
