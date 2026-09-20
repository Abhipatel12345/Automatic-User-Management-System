import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ShoppingBag,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { getCustomers, deleteCustomer } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import CustomerModal from './CustomerModal';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function CustomerList() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [pagination.page, pagination.limit, statusFilter, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        loadCustomers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      setCustomers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (err) {
        alert(err.message || 'Failed to delete customer');
      }
    }
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Users size={28} style={{ color: 'var(--primary)' }} />
            <span>Customer Management</span>
          </h1>
          <p>Complete directory of {pagination.total} registered customer accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingCustomer(null); setShowModal(true); }}>
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            {/* Search Input */}
            <div className="search-input-wrapper" style={{ minWidth: '280px' }}>
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search name, phone, customer code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter & Sort Controls */}
            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Status:</span>
                <SearchableSelect
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'PAID', label: 'Fully Paid' },
                    { value: 'PARTIAL', label: 'Partial' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'OVERDUE', label: 'Overdue' }
                  ]}
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val || 'ALL');
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  clearable={false}
                  placeholder="Filter Status"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sort:</span>
                <SearchableSelect
                  options={[
                    { value: 'createdAt-desc', label: 'Newest First' },
                    { value: 'createdAt-asc', label: 'Oldest First' },
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' }
                  ]}
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(val) => {
                    if (val) {
                      const [field, order] = val.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }
                  }}
                  clearable={false}
                  placeholder="Sort By"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Rows:</span>
                <SearchableSelect
                  options={[
                    { value: 10, label: '10 Rows' },
                    { value: 25, label: '25 Rows' },
                    { value: 50, label: '50 Rows' },
                    { value: 100, label: '100 Rows' }
                  ]}
                  value={pagination.limit}
                  onChange={(val) => setPagination((p) => ({ ...p, limit: parseInt(val, 10), page: 1 }))}
                  clearable={false}
                  placeholder="Rows"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Photo</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Purchases</th>
                <th>Total Invoiced</th>
                <th>Total Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Last Payment</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {c.customerCode}
                      </span>
                    </td>
                    <td>
                      <img
                        src={c.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`}
                        alt={c.name}
                        className="customer-avatar"
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                        <Link to={`/customers/${c.id}`} style={{ hover: 'underline' }}>
                          {c.name}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {c.city ? `${c.city}, ${c.state || ''}` : 'No address specified'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>{c.mobile}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                        {c.totalPurchases}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatCurrency(c.totalPurchasedAmount)}
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {formatCurrency(c.totalPaid)}
                    </td>
                    <td style={{ fontWeight: 700, color: c.outstanding > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {formatCurrency(c.outstanding)}
                    </td>
                    <td>
                      <span className={`status-badge badge-${c.paymentStatus.toLowerCase()}`}>
                        {c.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDate(c.lastPayment)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <Link
                          to={`/customers/${c.id}`}
                          className="btn btn-outline btn-sm"
                          title="View Customer Profile"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setEditingCustomer(c);
                            setShowModal(true);
                          }}
                          title="Edit Customer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <Link
                          to={`/purchases/new?customerId=${c.id}`}
                          className="btn btn-outline btn-sm"
                          title="Add Purchase"
                        >
                          <ShoppingBag size={14} />
                        </Link>
                        <Link
                          to={`/payments/collect?customerId=${c.id}`}
                          className="btn btn-outline btn-sm"
                          title="Record Payment"
                          style={{ color: 'var(--success)' }}
                        >
                          <CreditCard size={14} />
                        </Link>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Delete Customer"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div className="pagination-wrapper" style={{ margin: 0, border: 'none', padding: 0 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {customers.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              <strong>{pagination.total}</strong> customers
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (pagination.totalPages > 5 && pagination.page > 3) {
                  pNum = pagination.page - 3 + i;
                  if (pNum > pagination.totalPages) pNum = pagination.totalPages - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    className={`page-btn ${pagination.page === pNum ? 'active' : ''}`}
                    onClick={() => setPagination((p) => ({ ...p, page: pNum }))}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                className="page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSuccess={loadCustomers}
        />
      )}
    </div>
  );
}
