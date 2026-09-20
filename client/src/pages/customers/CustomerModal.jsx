import React, { useState, useEffect } from 'react';
import { X, Upload, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { createCustomer, updateCustomer } from '../../api';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function CustomerModal({ customer, onClose, onSuccess }) {
  const isEdit = Boolean(customer);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        mobile: customer.mobile || '',
        alternateMobile: customer.alternateMobile || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        notes: customer.notes || ''
      });
      if (customer.photo) {
        setPhotoPreview(customer.photo);
      }
    }
  }, [customer]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.mobile.trim()) {
      setError('Mobile number is required');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (photoFile) {
        data.append('photo', photoFile);
      }

      if (isEdit) {
        await updateCustomer(customer.id, data);
      } else {
        await createCustomer(data);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {isEdit ? `Edit Customer — ${customer.customerCode}` : 'Register New Customer'}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {/* Photo Upload Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={30} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  <Upload size={14} />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  JPG, PNG or SVG. Max size 5MB.
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Mobile *</label>
                <input
                  type="tel"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="10-digit number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Mobile</label>
                <input
                  type="tel"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="Emergency / Alternate"
                  value={formData.alternateMobile}
                  onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                placeholder="House / Street / Colony"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <SearchableSelect
                  options={[
                    'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna',
                    'Mumbai', 'Pune', 'Nagpur', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot',
                    'Jaipur', 'Kota', 'Udaipur', 'Delhi', 'Noida', 'Gurugram', 'Lucknow', 'Kanpur', 'Raipur'
                  ]}
                  value={formData.city}
                  onChange={(val) => setFormData({ ...formData, city: val })}
                  creatable={true}
                  placeholder="Select or enter city..."
                  searchPlaceholder="Search or type city..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <SearchableSelect
                  options={[
                    'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh',
                    'Delhi', 'Haryana', 'Chhattisgarh', 'Karnataka', 'Tamil Nadu', 'Telangana',
                    'West Bengal', 'Punjab', 'Bihar', 'Odisha', 'Kerala', 'Andhra Pradesh'
                  ]}
                  value={formData.state}
                  onChange={(val) => setFormData({ ...formData, state: val })}
                  creatable={true}
                  placeholder="Select or enter state..."
                  searchPlaceholder="Search or type state..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Internal Remarks / Notes</label>
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                placeholder="Verification details, references, credit assessment notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
