import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Search, Filter, Printer, Eye, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { getPayments } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ReceiptModal from '../../components/receipt/ReceiptModal';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  useEffect(() => {
    loadPayments();
  }, [pagination.page, pagination.limit, paymentMethod, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        loadPayments();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await getPayments({
        page: pagination.page,
        limit: pagination.limit,
        search,
        paymentMethod,
        startDate,
        endDate
      });
      setPayments(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error loading payment history:', err);
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
            <Receipt size={28} style={{ color: 'var(--primary)' }} />
            <span>Payment History & Audit Ledger</span>
          </h1>
          <p>Complete historical log of {pagination.total} payments recorded across retail counters</p>
        </div>
        <Link to="/payments/collect" className="btn btn-primary">
          <CreditCard size={16} /> Record Payment
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <div className="search-input-wrapper" style={{ minWidth: '280px' }}>
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search receipt #, customer, or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Method:</span>
                <SearchableSelect
                  options={[
                    { value: 'ALL', label: 'All Methods' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'Card', label: 'Card' },
                    { value: 'Cheque', label: 'Cheque' }
                  ]}
                  value={paymentMethod}
                  onChange={(val) => {
                    setPaymentMethod(val || 'ALL');
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  clearable={false}
                  placeholder="Payment Method"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>From:</span>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>To:</span>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Payment Date</th>
                <th>Customer</th>
                <th>Product / Order</th>
                <th>Payment Method</th>
                <th>Ref / Txn #</th>
                <th>Recorded By</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No payments found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {p.receiptNumber}
                      </span>
                    </td>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        <Link to={`/customers/${p.customer.id}`}>{p.customer.name}</Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.customer.customerCode} • 📞 {p.customer.mobile}
                      </div>
                    </td>
                    <td>
                      <div>{p.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.installmentNumber !== 'Down Payment' ? `Inst #${p.installmentNumber}` : 'Down Payment'}
                      </div>
                    </td>
                    <td>
                      <span style={{ backgroundColor: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.referenceNumber || '—'}
                    </td>
                    <td>{p.recordedBy}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedReceiptId(p.id)}
                        title="Print Receipt"
                      >
                        <Printer size={14} /> Receipt
                      </button>
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
              Showing {payments.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              <strong>{pagination.total}</strong> payment receipts
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

      {/* Receipt Modal Popup */}
      {selectedReceiptId && (
        <ReceiptModal
          paymentId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
