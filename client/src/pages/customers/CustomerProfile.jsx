import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Edit2,
  ChevronLeft,
  ArrowRight,
  Printer
} from 'lucide-react';
import { getCustomerById, updateCustomer } from '../../api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import CustomerModal from './CustomerModal';
import ReceiptModal from '../../components/receipt/ReceiptModal';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, purchases, schedule, history, notes

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  // Notes edit state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getCustomerById(id);
      setCustomerData(res.data);
      setNotes(res.data?.customer?.notes || '');
    } catch (err) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const fd = new FormData();
      fd.append('notes', notes);
      await updateCustomer(id, fd);
      alert('Notes saved successfully');
      loadProfile();
    } catch (err) {
      alert('Failed to save notes: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="content-container">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading customer profile...
        </div>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="content-container">
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: 'var(--danger)', margin: '0 auto 12px' }} />
          <h3>Customer Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{error || 'Unable to retrieve record'}</p>
          <Link to="/customers" className="btn btn-secondary" style={{ marginTop: '20px' }}>
            <ChevronLeft size={16} /> Back to Customer List
          </Link>
        </div>
      </div>
    );
  }

  const { customer, financialSummary, purchases, allInstallments, payments } = customerData;

  return (
    <div className="content-container">
      {/* Back link & Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <ChevronLeft size={16} /> Back to Customers
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            <Edit2 size={16} /> Edit Profile
          </button>
          <Link to={`/purchases/new?customerId=${customer.id}`} className="btn btn-secondary">
            <ShoppingBag size={16} /> New Purchase
          </Link>
          <Link to={`/payments/collect?customerId=${customer.id}`} className="btn btn-primary">
            <CreditCard size={16} /> Record Payment
          </Link>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <img
              src={customer.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`}
              alt={customer.name}
              style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--primary)' }}
            />
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-white)' }}>{customer.name}</h2>
                <span style={{ fontFamily: 'monospace', padding: '3px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                  {customer.customerCode}
                </span>
                {financialSummary.overdueAmount > 0 ? (
                  <span className="status-badge badge-overdue">Overdue</span>
                ) : financialSummary.totalOutstanding === 0 && purchases.length > 0 ? (
                  <span className="status-badge badge-paid">Fully Paid</span>
                ) : (
                  <span className="status-badge badge-pending">Active</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={15} style={{ color: 'var(--primary)' }} />
                  <span style={{ color: 'var(--text-white)' }}>{customer.mobile}</span>
                  {customer.alternateMobile && <span style={{ color: 'var(--text-muted)' }}>/ {customer.alternateMobile}</span>}
                </div>
                {customer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} style={{ color: 'var(--primary)' }} />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} style={{ color: 'var(--primary)' }} />
                  <span>
                    {customer.address ? `${customer.address}, ` : ''}
                    {customer.city} {customer.state ? `(${customer.state})` : ''} {customer.pincode}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} style={{ color: 'var(--primary)' }} />
                  <span>Customer since {formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary KPI Banner */}
      <div className="card" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-hover)', marginBottom: '28px' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Customer Financial Ledger Summary
        </div>
        <div className="card-body" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Purchases</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>
                {formatCurrency(financialSummary.totalPurchaseAmount)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{purchases.length} total orders</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Down Payment</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>
                {formatCurrency(financialSummary.totalDownPayment)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Initial advance paid</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--success)' }}>Total Amount Paid</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                {formatCurrency(financialSummary.totalPaid)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total realized collections</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--warning)' }}>Total Outstanding</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                {formatCurrency(financialSummary.totalOutstanding)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending principal balance</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>Overdue Balance</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
                {formatCurrency(financialSummary.overdueAmount)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Past due date</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Tabs Navigation */}
      <div className="erp-tabs">
        <button
          className={`erp-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={16} /> Overview
        </button>
        <button
          className={`erp-tab ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <ShoppingBag size={16} /> Purchases ({purchases.length})
        </button>
        <button
          className={`erp-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Clock size={16} /> Payment Schedule ({allInstallments.length})
        </button>
        <button
          className={`erp-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <CreditCard size={16} /> Payment History ({payments.length})
        </button>
        <button
          className={`erp-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={16} /> Documents & Notes
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Payment Transactions</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {payments.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No payment records yet.
                </div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{p.receiptNumber}</td>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td>{p.paymentMethod}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setSelectedReceiptId(p.id)}
                          >
                            <Printer size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Customer Profile Details Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Account Details</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Customer ID</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{customer.customerCode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Contact</span>
                  <span>{customer.mobile}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>City / Region</span>
                  <span>{customer.city || '—'}, {customer.state || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Postal Pincode</span>
                  <span>{customer.pincode || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Created</span>
                  <span>{formatDate(customer.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Updated</span>
                  <span>{formatDateTime(customer.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Product Purchases & Plans</div>
            <Link to={`/purchases/new?customerId=${customer.id}`} className="btn btn-primary btn-sm">
              <PlusCircle size={14} /> Add Purchase
            </Link>
          </div>
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Total Price</th>
                  <th>Down Payment</th>
                  <th>Installments</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No purchases on record for this customer.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const out = Number(p.outstandingAmount);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>ORD-{p.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.product?.name || p.customItemName || 'Item'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Qty: {p.quantity} • {p.installmentFrequency}
                          </div>
                        </td>
                        <td>{formatDate(p.purchaseDate)}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(p.totalAmount)}</td>
                        <td>{formatCurrency(p.downPayment)}</td>
                        <td>{p.installmentCount} months</td>
                        <td style={{ fontWeight: 700, color: out > 0 ? 'var(--warning)' : 'var(--success)' }}>
                          {formatCurrency(out)}
                        </td>
                        <td>
                          <span className={`status-badge badge-${out === 0 ? 'paid' : 'pending'}`}>
                            {out === 0 ? 'Fully Paid' : 'Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/payments/collect?customerId=${customer.id}&purchaseId=${p.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            Pay Installment
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Comprehensive Installment Repayment Schedule</div>
              <div className="card-subtitle">All scheduled installments across customer purchases</div>
            </div>
            <Link to={`/payments/collect?customerId=${customer.id}`} className="btn btn-primary btn-sm">
              <CreditCard size={14} /> Record Payment
            </Link>
          </div>
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Inst #</th>
                  <th>Product Plan</th>
                  <th>Due Date</th>
                  <th>Installment Amount</th>
                  <th>Paid Amount</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Overdue</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allInstallments.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No active installments for this customer.
                    </td>
                  </tr>
                ) : (
                  allInstallments.map((inst) => (
                    <tr key={inst.id}>
                      <td style={{ fontWeight: 700 }}>#{inst.installmentNumber}</td>
                      <td>{inst.productName}</td>
                      <td>{formatDate(inst.dueDate)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(inst.amount)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {formatCurrency(inst.paidAmount)}
                      </td>
                      <td style={{ fontWeight: 700, color: inst.remainingAmount > 0 ? 'var(--text-white)' : 'var(--text-muted)' }}>
                        {formatCurrency(inst.remainingAmount)}
                      </td>
                      <td>
                        <span className={`status-badge badge-${inst.status.toLowerCase()}`}>
                          {inst.status}
                        </span>
                      </td>
                      <td>
                        {inst.daysOverdue > 0 ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                            {inst.daysOverdue} days
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {inst.remainingAmount > 0 ? (
                          <Link
                            to={`/payments/collect?customerId=${customer.id}&purchaseId=${inst.purchaseId}&installmentId=${inst.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px' }}
                          >
                            Pay
                          </Link>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                            <CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Payment Audit History & Receipts</div>
              <div className="card-subtitle">Every payment voucher logged against this account</div>
            </div>
            <Link to={`/payments/collect?customerId=${customer.id}`} className="btn btn-primary btn-sm">
              <CreditCard size={14} /> Record Payment
            </Link>
          </div>
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Payment Date</th>
                  <th>Product / Description</th>
                  <th>Method</th>
                  <th>Reference / Txn</th>
                  <th>Recorded By</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {p.receiptNumber}
                      </td>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td>{p.purchase?.product?.name || p.purchase?.customItemName || 'Down Payment / Purchase'}</td>
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
        </div>
      )}

      {/* TAB 5: DOCUMENTS & NOTES */}
      {activeTab === 'notes' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Customer Internal Documentation & Notes</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Account Notes, Verification & Identity Details</label>
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '160px', lineHeight: 1.6 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter credit remarks, guarantor details, workplace verification, or customer follow-up notes..."
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && (
        <CustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadProfile}
        />
      )}

      {selectedReceiptId && (
        <ReceiptModal
          paymentId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
