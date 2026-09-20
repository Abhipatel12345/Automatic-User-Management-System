import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CreditCard, Search, User, AlertCircle, CheckCircle2, Printer, ChevronLeft, ArrowRight } from 'lucide-react';
import { getCustomers, getCustomerById, recordPayment } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import SearchableSelect from '../../components/common/SearchableSelect';
import ReceiptModal from '../../components/receipt/ReceiptModal';

export default function PaymentCollection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramCustomerId = searchParams.get('customerId');
  const paramPurchaseId = searchParams.get('purchaseId');
  const paramInstallmentId = searchParams.get('installmentId');

  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(paramCustomerId || '');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // Form State
  const [purchaseId, setPurchaseId] = useState(paramPurchaseId || '');
  const [installmentId, setInstallmentId] = useState(paramInstallmentId || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('Admin');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successReceiptId, setSuccessReceiptId] = useState(null);

  // Format customer option for combobox
  const formatCustomerOption = (c) => ({
    value: c.id,
    label: c.name,
    subLabel: `${c.customerCode} • 📞 ${c.mobile}`,
    badge: c.outstanding > 0 ? `Due: ₹${c.outstanding}` : 'Clear',
    raw: c
  });

  // Load initial customer options
  useEffect(() => {
    getCustomers({ limit: 50 })
      .then((res) => {
        const formatted = (res.data || []).map(formatCustomerOption);
        setCustomerOptions(formatted);
      })
      .catch((err) => console.error(err));
  }, []);

  // Server-side debounced search for customers
  const searchCustomers = useCallback(async (query) => {
    try {
      const res = await getCustomers({ search: query, limit: 30 });
      return (res.data || []).map(formatCustomerOption);
    } catch (err) {
      console.error('Customer search error:', err);
      return [];
    }
  }, []);

  // Load selected customer profile & purchases
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetails(null);
      return;
    }

    setLoadingCustomer(true);
    getCustomerById(selectedCustomerId)
      .then((res) => {
        setCustomerDetails(res.data);
        // Pre-select first purchase if none selected
        if (!purchaseId && res.data.purchases?.length > 0) {
          const active = res.data.purchases.find((p) => Number(p.outstandingAmount) > 0) || res.data.purchases[0];
          setPurchaseId(String(active.id));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingCustomer(false));
  }, [selectedCustomerId]);

  // When purchase is selected, find matching installments
  const activePurchase = customerDetails?.purchases?.find((p) => String(p.id) === String(purchaseId));

  // Options for Purchases combobox
  const purchaseOptions = (customerDetails?.purchases || []).map((p) => ({
    value: String(p.id),
    label: `${p.product?.name || p.customItemName || 'Item'} (ORD-${p.id})`,
    subLabel: `Total: ₹${p.totalAmount} • Plan: ${p.installmentCount} mos`,
    badge: `Outstanding: ₹${p.outstandingAmount}`
  }));

  // Options for Installments combobox
  const installmentOptions = [
    {
      value: '',
      label: 'Lump-sum Account Credit',
      subLabel: 'Apply payment directly against purchase balance'
    },
    ...(activePurchase?.installments || []).map((inst) => ({
      value: String(inst.id),
      label: `Installment #${inst.installmentNumber} (Due: ${formatDate(inst.dueDate)})`,
      subLabel: `Amount: ₹${inst.amount} • Paid: ₹${inst.paidAmount}`,
      badge: `Remaining: ₹${inst.remainingAmount} (${inst.status})`,
      remainingAmount: inst.remainingAmount
    }))
  ];

  // When installment is selected, auto-populate remaining amount
  const handleInstallmentChange = (instId, option) => {
    setInstallmentId(instId);
    if (!instId) {
      setAmount('');
      return;
    }
    const inst = activePurchase?.installments?.find((i) => String(i.id) === String(instId));
    if (inst) {
      setAmount(Number(inst.remainingAmount));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }
    if (!purchaseId) {
      setError('Please select a purchase order');
      return;
    }
    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (installmentId) {
      const target = activePurchase?.installments?.find((i) => String(i.id) === String(installmentId));
      if (target && payNum > Number(target.remainingAmount)) {
        setError(`Payment amount cannot exceed installment remaining balance (₹${target.remainingAmount})`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await recordPayment({
        customerId: parseInt(selectedCustomerId, 10),
        purchaseId: parseInt(purchaseId, 10),
        installmentId: installmentId ? parseInt(installmentId, 10) : null,
        amount: payNum,
        paymentMethod,
        paymentDate,
        referenceNumber,
        notes,
        recordedBy
      });

      // Show receipt modal immediately
      setSuccessReceiptId(res.data.id);
    } catch (err) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/payments" className="btn btn-outline btn-sm">
          <ChevronLeft size={16} /> Payment History
        </Link>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-white)' }}>
          Record Customer Payment
        </h1>
      </div>

      {error && (
        <div style={{ padding: '14px 20px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
          {/* Step 1 & 2: Customer & Account Selection */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">1. Customer & Purchase Order</div>
            </div>
            <div className="card-body">
              {/* Customer Searchable Combobox */}
              <div className="form-group">
                <label className="form-label">Search & Select Customer *</label>
                <SearchableSelect
                  options={customerOptions}
                  value={selectedCustomerId}
                  onChange={(val) => {
                    setSelectedCustomerId(val);
                    setPurchaseId('');
                    setInstallmentId('');
                    setAmount('');
                  }}
                  onSearch={searchCustomers}
                  placeholder="Search customer by name, mobile, or ID..."
                  searchPlaceholder="Type name, phone or ID to search..."
                />
              </div>

              {/* Customer Financial Badge */}
              {customerDetails && (
                <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-white)' }}>{customerDetails.customer.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        ID: {customerDetails.customer.customerCode} • 📞 {customerDetails.customer.mobile}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Outstanding</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: customerDetails.financialSummary.totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {formatCurrency(customerDetails.financialSummary.totalOutstanding)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase Selector */}
              {customerDetails && (
                <div className="form-group">
                  <label className="form-label">Target Purchase / Product *</label>
                  {customerDetails.purchases?.length === 0 ? (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      This customer has no purchases yet.{' '}
                      <Link to={`/purchases/new?customerId=${selectedCustomerId}`} style={{ color: 'var(--primary)' }}>
                        Create a purchase first
                      </Link>
                    </div>
                  ) : (
                    <SearchableSelect
                      options={purchaseOptions}
                      value={purchaseId}
                      onChange={(val) => {
                        setPurchaseId(val);
                        setInstallmentId('');
                        setAmount('');
                      }}
                      placeholder="Select target purchase order..."
                      searchPlaceholder="Search purchases..."
                    />
                  )}
                </div>
              )}

              {/* Installment Selector */}
              {activePurchase && (
                <div className="form-group">
                  <label className="form-label">Select Specific Installment (Optional)</label>
                  <SearchableSelect
                    options={installmentOptions}
                    value={installmentId}
                    onChange={handleInstallmentChange}
                    placeholder="Lump-sum account credit or choose installment..."
                    searchPlaceholder="Search installment # or date..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Payment Transaction Details */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">2. Payment Voucher Details</div>
            </div>
            <div className="card-body">
              {/* Payment Amount */}
              <div className="form-group">
                <label className="form-label">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  style={{ width: '100%', fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Partial payments are fully supported. The installment remaining balance will update automatically.
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <SearchableSelect
                    options={[
                      { value: 'UPI', label: 'UPI / QR Code' },
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Bank Transfer', label: 'Bank Transfer / NEFT' },
                      { value: 'Card', label: 'Debit / Credit Card' },
                      { value: 'Cheque', label: 'Cheque' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val)}
                    clearable={false}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Reference Number */}
              <div className="form-group">
                <label className="form-label">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', fontFamily: 'monospace' }}
                  placeholder="e.g. UPI-1234567890 or Cheque #8821"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              {/* Internal Notes */}
              <div className="form-group">
                <label className="form-label">Collection Notes</label>
                <textarea
                  className="form-control"
                  style={{ width: '100%', minHeight: '60px' }}
                  placeholder="Counter notes, cashier initials, payment confirmation message..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                disabled={submitting || !selectedCustomerId || !purchaseId}
              >
                <CreditCard size={18} />
                {submitting ? 'Processing Payment...' : 'Record Payment & Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Success Receipt Popup Modal */}
      {successReceiptId && (
        <ReceiptModal
          paymentId={successReceiptId}
          onClose={() => {
            setSuccessReceiptId(null);
            navigate(`/customers/${selectedCustomerId}`);
          }}
        />
      )}
    </div>
  );
}
