import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Eye, 
  User, 
  PlusCircle, 
  X, 
  Calendar, 
  CreditCard, 
  Package, 
  FileText,
  DollarSign
} from 'lucide-react';

export default function PurchaseSuccessModal({ data, onClose, onResetForm }) {
  const navigate = useNavigate();

  if (!data) return null;

  const {
    purchaseId,
    customerId,
    customerName,
    customerCode,
    productName,
    quantity = 1,
    totalAmount = 0,
    downPayment = 0,
    outstandingAmount = 0,
    installmentCount = 0,
    firstDueDate,
    paymentPlan = 'INSTALLMENT'
  } = data;

  const formattedTotal = Number(totalAmount).toLocaleString('en-IN');
  const formattedDown = Number(downPayment).toLocaleString('en-IN');
  const formattedOutstanding = Number(outstandingAmount).toLocaleString('en-IN');

  const formattedDueDate = firstDueDate 
    ? new Date(firstDueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'N/A';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Banner with Success Gradient */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '28px 24px',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            title="Close"
          >
            <X size={18} />
          </button>

          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.15)'
            }}
          >
            <CheckCircle2 size={38} color="#ffffff" strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Purchase Created Successfully!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.92)', margin: 0 }}>
            The product purchase and installment payment schedule have been established.
          </p>
        </div>

        {/* Modal Body / Summary Cards */}
        <div style={{ padding: '24px', backgroundColor: '#ffffff' }}>
          {/* Main Info Strip */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            <div 
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5',
                  flexShrink: 0
                }}
              >
                <User size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Customer
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {customerName || 'Customer'}
                </div>
                {customerCode && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
                    {customerCode}
                  </div>
                )}
              </div>
            </div>

            <div 
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0
                }}
              >
                <Package size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Product / Item
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {productName || 'Product Item'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
                  Qty: {quantity}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div 
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Financial Summary
            </div>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>₹{formattedTotal}</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Down Payment</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>₹{formattedDown}</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Outstanding</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: outstandingAmount > 0 ? '#d97706' : '#059669' }}>
                  ₹{formattedOutstanding}
                </div>
              </div>
            </div>

            {/* Installment Info */}
            {paymentPlan === 'INSTALLMENT' && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  color: '#475569'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={15} color="#6366f1" />
                  <span>Plan: <strong>{installmentCount} Installments</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#6366f1" />
                  <span>First Due: <strong>{formattedDueDate}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '10px'
            }}
          >
            {purchaseId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  navigate(`/purchases/${purchaseId}`);
                }}
                style={{
                  padding: '11px 16px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <FileText size={16} />
                View Purchase Details
              </button>
            )}

            {customerId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  navigate(`/customers/${customerId}`);
                }}
                style={{
                  padding: '11px 16px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <User size={16} />
                View Customer Profile
              </button>
            )}
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '10px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onResetForm) onResetForm();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 0'
              }}
            >
              <PlusCircle size={16} />
              Record Another Purchase
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                padding: '6px 12px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
