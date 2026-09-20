import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { getPaymentReceipt } from '../../api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export default function ReceiptModal({ paymentId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paymentId) return;
    setLoading(true);
    getPaymentReceipt(paymentId)
      .then((res) => {
        setReceipt(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load receipt');
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (!paymentId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container large"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '750px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Payment Receipt & Voucher</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Generating receipt voucher...
            </div>
          ) : error ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--danger)' }}>
              {error}
            </div>
          ) : receipt ? (
            <div id="printable-receipt" className="receipt-voucher">
              {/* Header */}
              <div className="receipt-voucher-header">
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    {receipt.businessName}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    {receipt.businessAddress}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {receipt.businessContact}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      fontFamily: 'monospace'
                    }}
                  >
                    RECEIPT
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginTop: '6px' }}>
                    {receipt.receiptNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Date: {formatDate(receipt.payment.paymentDate)}
                  </div>
                </div>
              </div>

              {/* Customer & Transaction Details Grid */}
              <div className="receipt-grid">
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                    Customer Details
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    {receipt.customer.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                    ID: <strong>{receipt.customer.customerCode}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    Mobile: {receipt.customer.mobile}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    {receipt.customer.address}, {receipt.customer.city}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                    Payment Summary
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <strong style={{ color: '#0f172a' }}>{receipt.payment.paymentMethod}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Reference / Txn:</span>
                    <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                      {receipt.payment.referenceNumber || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Authorized By:</span>
                    <strong style={{ color: '#0f172a' }}>{receipt.payment.recordedBy}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b' }}>Recorded At:</span>
                    <span style={{ color: '#0f172a' }}>{formatDateTime(receipt.payment.paymentDate)}</span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item / Description</th>
                    <th>Installment #</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{receipt.product.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Total Value: {formatCurrency(receipt.product.totalAmount)}
                      </div>
                    </td>
                    <td>
                      {receipt.installmentInfo ? `Inst #${receipt.installmentInfo.installmentNumber}` : 'Down Payment'}
                    </td>
                    <td>
                      {receipt.installmentInfo ? formatDate(receipt.installmentInfo.dueDate) : formatDate(receipt.payment.paymentDate)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: '#16a34a' }}>
                      {formatCurrency(receipt.payment.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Remaining Balance Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '14px 20px',
                  borderRadius: '6px',
                  marginBottom: '28px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Remaining Account Balance
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    Outstanding across active purchase
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                  {formatCurrency(receipt.product.remainingBalance)}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '32px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ borderBottom: '1px solid #94a3b8', height: '30px', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Customer Signature</span>
                </div>
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ borderBottom: '1px solid #94a3b8', height: '30px', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Authorized Signatory</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={!receipt}>
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
