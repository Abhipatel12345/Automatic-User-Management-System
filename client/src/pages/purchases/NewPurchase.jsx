import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Calendar, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { getCustomers, getProducts, createPurchase, previewSchedule } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import SearchableSelect from '../../components/common/SearchableSelect';
import PurchaseSuccessModal from '../../components/purchases/PurchaseSuccessModal';

export default function NewPurchase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [customerOptions, setCustomerOptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || '',
    productId: '',
    customItemName: '',
    quantity: 1,
    purchaseDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    downPayment: 0,
    paymentPlan: 'INSTALLMENT',
    installmentCount: 6,
    installmentFrequency: 'MONTHLY',
    firstDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  });

  const [schedulePreview, setSchedulePreview] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);

  // Transform customer data into combobox option format
  const formatCustomerOption = (c) => ({
    value: c.id,
    label: c.name,
    subLabel: `${c.customerCode} • 📞 ${c.mobile}`,
    badge: c.outstanding > 0 ? `Due: ₹${c.outstanding}` : 'Clear',
    raw: c
  });

  // Load initial options
  useEffect(() => {
    Promise.all([
      getCustomers({ limit: 50 }),
      getProducts()
    ])
      .then(([custRes, prodRes]) => {
        const formatted = (custRes.data || []).map(formatCustomerOption);
        setCustomerOptions(formatted);
        setProducts(prodRes.data || []);
        if (preselectedCustomerId) {
          setFormData((prev) => ({ ...prev, customerId: preselectedCustomerId }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingInitial(false));
  }, [preselectedCustomerId]);

  // Server-side debounced search for customers (handles 2,000+ customers)
  const searchCustomers = useCallback(async (query) => {
    try {
      const res = await getCustomers({ search: query, limit: 30 });
      return (res.data || []).map(formatCustomerOption);
    } catch (err) {
      console.error('Customer search error:', err);
      return [];
    }
  }, []);

  // Format products for combobox
  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
    subLabel: p.price ? formatCurrency(p.price) : 'Custom price',
    badge: p.price ? `₹${p.price}` : null,
    price: p.price
  }));

  // Handle product selection (either existing catalog item or custom text)
  const handleProductSelect = (selectedVal, option) => {
    if (!selectedVal) {
      setFormData((prev) => ({ ...prev, productId: '' }));
      return;
    }

    if (option && option.price) {
      const price = Number(option.price) * formData.quantity;
      setFormData((prev) => ({
        ...prev,
        productId: selectedVal,
        totalAmount: price,
        downPayment: Math.round(price * 0.2) // default 20% down payment
      }));
    } else {
      // Custom entered product
      setFormData((prev) => ({
        ...prev,
        productId: selectedVal
      }));
    }
  };

  // Live schedule preview calculation
  useEffect(() => {
    const total = parseFloat(formData.totalAmount);
    const down = parseFloat(formData.downPayment) || 0;
    const count = parseInt(formData.installmentCount, 10);

    if (total > 0 && count > 0 && formData.firstDueDate && formData.paymentPlan === 'INSTALLMENT') {
      const principal = Math.max(0, total - down);
      if (principal > 0) {
        setLoadingPreview(true);
        previewSchedule({
          totalAmount: total,
          downPayment: down,
          installmentCount: count,
          firstDueDate: formData.firstDueDate,
          frequency: formData.installmentFrequency
        })
          .then((res) => {
            setSchedulePreview(res.data?.schedule || []);
          })
          .catch((err) => console.error(err))
          .finally(() => setLoadingPreview(false));
      } else {
        setSchedulePreview([]);
      }
    } else {
      setSchedulePreview([]);
    }
  }, [
    formData.totalAmount,
    formData.downPayment,
    formData.installmentCount,
    formData.firstDueDate,
    formData.installmentFrequency,
    formData.paymentPlan
  ]);

  const handleResetForm = () => {
    setPurchaseSuccessData(null);
    setFormData({
      customerId: '',
      productId: '',
      customItemName: '',
      quantity: 1,
      purchaseDate: new Date().toISOString().split('T')[0],
      totalAmount: '',
      downPayment: 0,
      paymentPlan: 'INSTALLMENT',
      installmentCount: 6,
      installmentFrequency: 'MONTHLY',
      firstDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod: 'Cash',
      notes: ''
    });
    setSchedulePreview([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }

    const hasProductId = formData.productId && String(formData.productId).trim() !== '';
    const hasCustomItem = formData.customItemName && String(formData.customItemName).trim() !== '';

    if (!hasProductId && !hasCustomItem) {
      setError('Please select a product or enter a custom item name.');
      return;
    }

    if (hasProductId && hasCustomItem) {
      setError('Please select a product OR enter a custom item name, not both.');
      return;
    }

    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      setError('Please enter a valid total amount');
      return;
    }
    if (Number(formData.downPayment) > Number(formData.totalAmount)) {
      setError('Down payment cannot exceed total amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPurchase(formData);
      const createdPurchase = res.data?.purchase || {};

      const selectedCustomer = customerOptions.find((c) => String(c.value) === String(formData.customerId));
      const selectedProduct = products.find((p) => String(p.id) === String(formData.productId));
      const displayProductName = selectedProduct 
        ? selectedProduct.name 
        : (createdPurchase.customItemName || formData.customItemName || 'Custom Item');

      setPurchaseSuccessData({
        purchaseId: createdPurchase.id,
        customerId: createdPurchase.customerId || formData.customerId,
        customerName: selectedCustomer ? selectedCustomer.label : 'Customer',
        customerCode: selectedCustomer?.raw?.customerCode || '',
        productName: displayProductName,
        quantity: formData.quantity,
        totalAmount: createdPurchase.totalAmount || formData.totalAmount,
        downPayment: createdPurchase.downPayment || formData.downPayment,
        outstandingAmount: createdPurchase.outstandingAmount !== undefined ? createdPurchase.outstandingAmount : principalRemaining,
        installmentCount: createdPurchase.installmentCount || formData.installmentCount,
        firstDueDate: createdPurchase.firstDueDate || formData.firstDueDate,
        paymentPlan: formData.paymentPlan
      });
    } catch (err) {
      setError(err.message || 'Failed to create purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const principalRemaining = Math.max(
    0,
    (parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.downPayment) || 0)
  );

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/purchases" className="btn btn-outline btn-sm">
          <ChevronLeft size={16} /> All Purchases
        </Link>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-white)' }}>
          Record New Product Purchase
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
          {/* Left Column: Purchase Form */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Purchase & Product Details</div>
            </div>
            <div className="card-body">
              {/* Customer Searchable Combobox */}
              <div className="form-group">
                <label className="form-label">Customer Account *</label>
                <SearchableSelect
                  options={customerOptions}
                  value={formData.customerId}
                  onChange={(val) => setFormData((prev) => ({ ...prev, customerId: val }))}
                  onSearch={searchCustomers}
                  placeholder="Search customer by name, mobile, or ID (e.g. CUST-000001)..."
                  searchPlaceholder="Type name, phone or ID to search..."
                />
              </div>

              {/* Product / Item Selection: Existing Catalog Dropdown + Custom Item Name Field */}
              <div className="form-group">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', alignItems: 'start' }}>
                  {/* Option 1: Existing Catalog Product */}
                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Product / Item *</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>Option 1: Catalog</span>
                    </label>
                    <SearchableSelect
                      options={productOptions}
                      value={formData.productId}
                      onChange={handleProductSelect}
                      clearable={true}
                      placeholder="Select from existing items..."
                      searchPlaceholder="Search catalog products..."
                    />
                  </div>

                  {/* Option 2: Custom Item Name */}
                  <div>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Custom Item Name</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Option 2: Non-Catalog</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', height: '40px' }}
                      placeholder="Enter item name manually..."
                      value={formData.customItemName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, customItemName: e.target.value }));
                        if (error) setError('');
                      }}
                    />
                  </div>
                </div>

                {/* Helper Note */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Select an existing item <strong>OR</strong> enter a custom item if it is not available in the catalog.
                </div>
              </div>

              {/* Quantity & Purchase Date */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={formData.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value, 10) || 1;
                      const selected = products.find((p) => String(p.id) === String(formData.productId));
                      const total = selected && selected.price ? Number(selected.price) * qty : formData.totalAmount;
                      setFormData({
                        ...formData,
                        quantity: qty,
                        totalAmount: total,
                        downPayment: Math.round(total * 0.2)
                      });
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Total & Down Payment */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Total Invoiced Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    style={{ width: '100%', fontWeight: 700, fontSize: '1.05rem' }}
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Down Payment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    style={{ width: '100%', fontWeight: 700, fontSize: '1.05rem', color: 'var(--success)' }}
                    value={formData.downPayment}
                    onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                  />
                </div>
              </div>

              {Number(formData.downPayment) > 0 && (
                <div className="form-group">
                  <label className="form-label">Down Payment Mode</label>
                  <SearchableSelect
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'UPI', label: 'UPI / QR Code' },
                      { value: 'Bank Transfer', label: 'Bank Transfer / IMPS' },
                      { value: 'Card', label: 'Debit / Credit Card' },
                      { value: 'Cheque', label: 'Cheque' }
                    ]}
                    value={formData.paymentMethod}
                    onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                    clearable={false}
                  />
                </div>
              )}

              {/* Automatic Remaining Calculation Banner */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Remaining Principal to Finance
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Total Amount - Down Payment
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>
                  {formatCurrency(principalRemaining)}
                </div>
              </div>

              {/* Installment Plan Options */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Number of Monthly Installments</label>
                  <SearchableSelect
                    options={[
                      { value: 1, label: '1 Monthly Installment' },
                      { value: 2, label: '2 Monthly Installments' },
                      { value: 3, label: '3 Monthly Installments' },
                      { value: 4, label: '4 Monthly Installments' },
                      { value: 6, label: '6 Monthly Installments' },
                      { value: 8, label: '8 Monthly Installments' },
                      { value: 9, label: '9 Monthly Installments' },
                      { value: 10, label: '10 Monthly Installments' },
                      { value: 12, label: '12 Monthly Installments' },
                      { value: 18, label: '18 Monthly Installments' },
                      { value: 24, label: '24 Monthly Installments' },
                      { value: 36, label: '36 Monthly Installments' }
                    ]}
                    value={formData.installmentCount}
                    onChange={(val) => setFormData({ ...formData, installmentCount: parseInt(val, 10) })}
                    clearable={false}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">First Installment Due Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={formData.firstDueDate}
                    onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Remarks</label>
                <textarea
                  className="form-control"
                  style={{ width: '100%', minHeight: '60px' }}
                  placeholder="Warranty terms, delivery serial numbers, special discount notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={submitting}
              >
                {submitting ? 'Generating Purchase Schedule...' : 'Confirm Purchase & Generate Schedule'}
              </button>
            </div>
          </div>

          {/* Right Column: Live Installment Schedule Preview */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Calculator size={18} style={{ color: 'var(--primary)' }} />
                Automatic Schedule Preview
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {schedulePreview.length} Installments
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {schedulePreview.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Enter total purchase amount and installment count to preview the schedule.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Scheduled Due Date</th>
                        <th>Due Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedulePreview.map((item) => (
                        <tr key={item.installmentNumber}>
                          <td style={{ fontWeight: 700 }}>Installment {item.installmentNumber}</td>
                          <td>{formatDate(item.dueDate)}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-white)' }}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td>
                            <span className="status-badge badge-pending">Pending</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Professional Purchase Success Modal */}
      {purchaseSuccessData && (
        <PurchaseSuccessModal
          data={purchaseSuccessData}
          onClose={() => setPurchaseSuccessData(null)}
          onResetForm={handleResetForm}
        />
      )}
    </div>
  );
}
