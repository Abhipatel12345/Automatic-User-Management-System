import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, PlusCircle, Search, Eye, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPurchases } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, [pagination.page, pagination.limit]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        loadPurchases();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await getPurchases({
        page: pagination.page,
        limit: pagination.limit,
        search
      });
      setPurchases(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error loading purchases:', err);
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
            <ShoppingBag size={28} style={{ color: 'var(--primary)' }} />
            <span>Product Purchases</span>
          </h1>
          <p>Complete ledger of sales contracts and installment financing plans</p>
        </div>
        <Link to="/purchases/new" className="btn btn-primary">
          <PlusCircle size={16} /> New Purchase
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <div className="search-input-wrapper" style={{ minWidth: '320px' }}>
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by customer, phone or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Purchase Date</th>
                <th>Total Value</th>
                <th>Down Payment</th>
                <th>Outstanding</th>
                <th>Installments Paid</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        ORD-{p.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        <Link to={`/customers/${p.customer.id}`}>{p.customer.name}</Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.customer.customerCode} • 📞 {p.customer.mobile}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.product?.name || p.customItemName || p.itemName || 'Item'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Qty: {p.quantity}
                      </div>
                    </td>
                    <td>{formatDate(p.purchaseDate)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(p.totalAmount)}</td>
                    <td>{formatCurrency(p.downPayment)}</td>
                    <td style={{ fontWeight: 700, color: p.outstandingAmount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {formatCurrency(p.outstandingAmount)}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {p.paidInstallments} / {p.installmentCount}
                      </span>
                      {p.overdueInstallments > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginLeft: '6px', fontWeight: 700 }}>
                          ({p.overdueInstallments} Overdue)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/customers/${p.customer.id}`}
                          className="btn btn-outline btn-sm"
                          title="View Customer Profile"
                        >
                          <Eye size={14} />
                        </Link>
                        {p.outstandingAmount > 0 && (
                          <Link
                            to={`/payments/collect?customerId=${p.customer.id}&purchaseId=${p.id}`}
                            className="btn btn-primary btn-sm"
                            title="Collect Payment"
                          >
                            <CreditCard size={14} /> Pay
                          </Link>
                        )}
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
              Showing {purchases.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              <strong>{pagination.total}</strong> orders
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
