import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Download, Calendar, Filter, ShoppingBag, CreditCard, Clock, Users } from 'lucide-react';
import { getSalesReport, getCollectionReport, getOutstandingReport, getCustomerReport } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sales'; // sales, collection, outstanding, customer

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ALL');

  useEffect(() => {
    loadReport();
  }, [activeTab, startDate, endDate, paymentMethod]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'sales') {
        res = await getSalesReport({ startDate, endDate });
      } else if (activeTab === 'collection') {
        res = await getCollectionReport({ startDate, endDate, paymentMethod });
      } else if (activeTab === 'outstanding') {
        res = await getOutstandingReport();
      } else {
        res = await getCustomerReport();
      }
      setReportData(res);
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let url = `/api/reports/${activeTab}?format=csv`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (paymentMethod && paymentMethod !== 'ALL') url += `&paymentMethod=${paymentMethod}`;
    window.open(url, '_blank');
  };

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <BarChart3 size={28} style={{ color: 'var(--primary)' }} />
            <span>Business Reports & Financial Analytics</span>
          </h1>
          <p>Generate auditable sales records, collections, and credit aging statements</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} /> Export to CSV (Excel)
        </button>
      </div>

      {/* Report Tabs */}
      <div className="erp-tabs">
        <button
          className={`erp-tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setTab('sales')}
        >
          <ShoppingBag size={16} /> Sales Report
        </button>
        <button
          className={`erp-tab ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setTab('collection')}
        >
          <CreditCard size={16} /> Collection Report
        </button>
        <button
          className={`erp-tab ${activeTab === 'outstanding' ? 'active' : ''}`}
          onClick={() => setTab('outstanding')}
        >
          <Clock size={16} /> Outstanding Aging Report
        </button>
        <button
          className={`erp-tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setTab('customer')}
        >
          <Users size={16} /> Customer Performance Report
        </button>
      </div>

      {/* Date & Method Filter Bar (for sales & collection) */}
      {(activeTab === 'sales' || activeTab === 'collection') && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>From Date:</span>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>To Date:</span>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {activeTab === 'collection' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Payment Mode:</span>
                  <SearchableSelect
                    options={[
                      { value: 'ALL', label: 'All Modes' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Bank Transfer', label: 'Bank Transfer' },
                      { value: 'Card', label: 'Card' },
                      { value: 'Cheque', label: 'Cheque' }
                    ]}
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val || 'ALL')}
                    clearable={false}
                    placeholder="Mode"
                  />
                </div>
              )}

              {(startDate || endDate || paymentMethod !== 'ALL') && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPaymentMethod('ALL');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Banner for Active Report */}
      {reportData?.summary && (
        <div className="card" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hover)', marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              {Object.entries(reportData.summary).map(([key, val]) => {
                if (typeof val === 'object') return null;
                const isAmount = typeof val === 'number' && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('sales') || key.toLowerCase().includes('collected') || key.toLowerCase().includes('outstanding') || key.toLowerCase().includes('overdue') || key.toLowerCase().includes('pending'));
                return (
                  <div key={key}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>
                      {isAmount ? formatCurrency(val) : val}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="card">
        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Generating report dataset...
            </div>
          ) : !reportData?.data || reportData.data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No records found for the selected parameters.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  {Object.keys(reportData.data[0]).map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Object.entries(row).map(([header, val], cIdx) => (
                      <td key={cIdx}>
                        {typeof val === 'number' && header.includes('(₹)') ? (
                          <strong style={{ color: 'var(--text-white)' }}>{formatCurrency(val)}</strong>
                        ) : header === 'Status' || header === 'Account Status' ? (
                          <span className={`status-badge badge-${String(val).toLowerCase().replace(/_/g, '-')}`}>
                            {val}
                          </span>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
