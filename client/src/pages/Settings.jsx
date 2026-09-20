import React, { useState } from 'react';
import { Settings as SettingsIcon, Building, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const [businessProfile, setBusinessProfile] = useState({
    businessName: 'Apex Electronics & Consumer Durables',
    address: 'Plot 104, Commercial Zone, MP Nagar, Bhopal - 462011',
    phone: '+91 755 422 9900',
    email: 'support@apexdurables.com',
    currencySymbol: '₹',
    defaultInstallmentCount: 6,
    defaultGracePeriodDays: 5
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="content-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <SettingsIcon size={28} style={{ color: 'var(--primary)' }} />
            <span>ERP System & Company Settings</span>
          </h1>
          <p>Configure business entity metadata, receipt branding, and payment policies</p>
        </div>
      </div>

      {saved && (
        <div style={{ padding: '12px 18px', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
          {/* Business Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Building size={18} style={{ color: 'var(--primary)' }} />
                Company / Store Branding
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Business Name (appears on receipts)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={businessProfile.businessName}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Address</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={businessProfile.address}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Support Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={businessProfile.phone}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Billing Email</label>
                  <input
                    type="email"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={businessProfile.email}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financing Policies */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                Installment Policies
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Default Installment Months</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={businessProfile.defaultInstallmentCount}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, defaultInstallmentCount: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Grace Period (Days)</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={businessProfile.defaultGracePeriodDays}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, defaultGracePeriodDays: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={businessProfile.currencySymbol}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, currencySymbol: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                Save Configurations
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
