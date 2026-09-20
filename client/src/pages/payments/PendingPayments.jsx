import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Search, CreditCard, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { getPendingPayments } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PendingPayments() {
  const [installments, setInstallments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        loadPending();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await getPendingPayments({
        page: pagination.page,
        limit: pagination.limit,
        search
      });
      setInstallments(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error loading pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Clock size={28} style={{ color: 'var(--primary)' }} />
            <span>Upcoming / Pending Payments</span>
          </h1>
          <p>Scheduled installments sorted chronologically by nearest upcoming due date</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="search-input-wrapper" style={{ minWidth: '320px' }}>
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search customer, mobile, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Installment #</th>
                <th>Due Date</th>
                <th>Total Due</th>
                <th>Already Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading upcoming installments...
                  </td>
                </tr>
              ) : installments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No pending upcoming installments found.
                  </td>
                </tr>
              ) : (
                installments.map((inst) => (
                  <tr key={inst.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        <Link to={`/customers/${inst.customer.id}`}>{inst.customer.name}</Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {inst.customer.customerCode} • 📞 {inst.customer.mobile}
                      </div>
                    </td>
                    <td>{inst.productName}</td>
                    <td style={{ fontWeight: 700 }}>#{inst.installmentNumber}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                        {formatDate(inst.dueDate)}
                      </span>
                    </td>
                    <td>{formatCurrency(inst.amount)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {formatCurrency(inst.paidAmount)}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--warning)' }}>
                      {formatCurrency(inst.remainingAmount)}
                    </td>
                    <td>
                      <span className={`status-badge badge-${inst.status.toLowerCase()}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/payments/collect?customerId=${inst.customer.id}&purchaseId=${inst.purchaseId}&installmentId=${inst.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        <CreditCard size={14} /> Pay Now
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div className="pagination-wrapper" style={{ margin: 0, border: 'none', padding: 0 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {installments.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              <strong>{pagination.total}</strong> pending installments
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ padding: '0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                className="page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
