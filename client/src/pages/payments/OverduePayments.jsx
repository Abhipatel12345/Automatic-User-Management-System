import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Search, CreditCard, Eye, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { getOverduePayments } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function OverduePayments() {
  const [installments, setInstallments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverdue();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        loadOverdue();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadOverdue = async () => {
    setLoading(true);
    try {
      const res = await getOverduePayments({
        page: pagination.page,
        limit: pagination.limit,
        search
      });
      setInstallments(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error loading overdue payments:', err);
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
            <AlertOctagon size={28} style={{ color: 'var(--danger)' }} />
            <span>Overdue Payments Priority Queue</span>
          </h1>
          <p>Delinquent installment accounts sorted by highest overdue duration for recovery follow-up</p>
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
              placeholder="Search delinquent customer, phone, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Overdue Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Product</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th>Installment Value</th>
                <th>Paid Amount</th>
                <th>Outstanding Due</th>
                <th>Priority</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading overdue records...
                  </td>
                </tr>
              ) : installments.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--success)' }}>
                    Excellent! Zero overdue installment payments at this time.
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
                        {inst.customer.customerCode} {inst.customer.city ? `• ${inst.customer.city}` : ''}
                      </div>
                    </td>
                    <td>
                      <a
                        href={`tel:${inst.customer.mobile}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', color: 'var(--primary)' }}
                      >
                        <Phone size={13} /> {inst.customer.mobile}
                      </a>
                    </td>
                    <td>{inst.productName}</td>
                    <td>{formatDate(inst.dueDate)}</td>
                    <td>
                      <span
                        style={{
                          backgroundColor: 'var(--danger-light)',
                          color: 'var(--danger)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '0.82rem'
                        }}
                      >
                        {inst.daysOverdue} Days
                      </span>
                    </td>
                    <td>{formatCurrency(inst.originalAmount)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(inst.paidAmount)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '0.95rem' }}>
                      {formatCurrency(inst.outstandingAmount)}
                    </td>
                    <td>
                      <span className="status-badge badge-overdue">
                        Overdue
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/customers/${inst.customer.id}`}
                          className="btn btn-outline btn-sm"
                          title="View Customer"
                        >
                          <Eye size={14} /> Profile
                        </Link>
                        <Link
                          to={`/payments/collect?customerId=${inst.customer.id}&purchaseId=${inst.purchaseId}&installmentId=${inst.id}`}
                          className="btn btn-primary btn-sm"
                          title="Collect Overdue Payment"
                        >
                          <CreditCard size={14} /> Collect
                        </Link>
                      </div>
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
              <strong>{pagination.total}</strong> overdue accounts
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
