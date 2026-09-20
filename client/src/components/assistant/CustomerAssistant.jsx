import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  X,
  Search,
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  UserPlus,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { searchCustomerByMobile } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function CustomerAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // { found: bool, data: customerObj }
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = mobileQuery.trim();
    if (!query) {
      setError('Please enter a mobile number');
      return;
    }
    if (query.length < 4) {
      setError('Please enter at least 4 digits');
      return;
    }

    setError('');
    setLoading(true);
    setSearchResult(null);

    try {
      const res = await searchCustomerByMobile(query);
      if (res.found && res.data) {
        setSearchResult({ found: true, customer: res.data });
      } else {
        setSearchResult({ found: false, queriedMobile: query });
      }
    } catch (err) {
      setError(err.message || 'Failed to lookup customer');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setMobileQuery('');
    setError('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="customer-assistant-root">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className="assistant-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open Customer Assistant"
          title="Open Customer Quick Assistant"
        >
          <div className="assistant-launcher-icon">
            <Bot size={24} />
          </div>
          <span className="assistant-launcher-label">Customer Assistant</span>
          <span className="assistant-launcher-pulse" />
        </button>
      )}

      {/* Assistant Window Card */}
      {isOpen && (
        <div className="assistant-window" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="assistant-header">
            <div className="assistant-header-title">
              <div className="assistant-avatar-badge">
                <Bot size={20} />
              </div>
              <div>
                <div className="assistant-title-text">
                  Customer Assistant
                  <span className="assistant-status-dot" />
                </div>
                <div className="assistant-subtitle-text">
                  Instant mobile lookup & quick actions
                </div>
              </div>
            </div>
            <button
              type="button"
              className="assistant-close-btn"
              onClick={() => setIsOpen(false)}
              title="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="assistant-body">
            {/* Search Input Box */}
            <form onSubmit={handleSearch} className="assistant-search-form">
              <label className="assistant-search-label">
                Search Customer by Mobile Number
              </label>
              <div className="assistant-input-group">
                <Phone size={16} className="assistant-input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  className="assistant-input"
                  placeholder="Enter 10-digit mobile number..."
                  value={mobileQuery}
                  onChange={(e) => {
                    setMobileQuery(e.target.value);
                    if (error) setError('');
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="assistant-search-btn"
                  title="Search Customer"
                >
                  {loading ? (
                    <span className="assistant-spinner" />
                  ) : (
                    <Search size={16} />
                  )}
                </button>
              </div>
              {error && (
                <div className="assistant-error-msg">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </form>

            {/* Results Area */}
            {searchResult && (
              <div className="assistant-result-area">
                {searchResult.found ? (
                  /* Customer Found Card */
                  <div className="assistant-customer-card">
                    <div className="assistant-card-top">
                      <div className="assistant-customer-avatar">
                        {searchResult.customer.photo ? (
                          <img
                            src={searchResult.customer.photo}
                            alt={searchResult.customer.name}
                          />
                        ) : (
                          <User size={22} />
                        )}
                      </div>
                      <div className="assistant-customer-meta">
                        <div className="assistant-customer-name">
                          {searchResult.customer.name}
                        </div>
                        <div className="assistant-customer-code">
                          {searchResult.customer.customerCode}
                        </div>
                        <div className="assistant-customer-phone">
                          <Phone size={12} />
                          <span>{searchResult.customer.mobile}</span>
                          {searchResult.customer.alternateMobile && (
                            <span className="assistant-alt-phone">
                              / {searchResult.customer.alternateMobile}
                            </span>
                          )}
                        </div>
                        {searchResult.customer.city && (
                          <div className="assistant-customer-location">
                            <MapPin size={12} />
                            <span>
                              {searchResult.customer.city}
                              {searchResult.customer.state ? `, ${searchResult.customer.state}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Metrics Grid */}
                    <div className="assistant-metrics-grid">
                      <div className="assistant-metric-item">
                        <div className="assistant-metric-label">Purchases</div>
                        <div className="assistant-metric-value">
                          {searchResult.customer.totalPurchases || 0}
                          <span className="assistant-metric-sub">
                            ({searchResult.customer.activePurchasesCount || 0} active)
                          </span>
                        </div>
                      </div>

                      <div className="assistant-metric-item">
                        <div className="assistant-metric-label">Outstanding</div>
                        <div
                          className="assistant-metric-value"
                          style={{
                            color:
                              searchResult.customer.totalOutstanding > 0
                                ? '#ef4444'
                                : '#10b981'
                          }}
                        >
                          {formatCurrency(searchResult.customer.totalOutstanding || 0)}
                        </div>
                      </div>

                      <div className="assistant-metric-item">
                        <div className="assistant-metric-label">Total Paid</div>
                        <div className="assistant-metric-value" style={{ color: '#10b981' }}>
                          {formatCurrency(searchResult.customer.totalPaid || 0)}
                        </div>
                      </div>

                      <div className="assistant-metric-item">
                        <div className="assistant-metric-label">Last Payment</div>
                        <div className="assistant-metric-value" style={{ fontSize: '0.78rem' }}>
                          {searchResult.customer.lastPaymentDate
                            ? formatDate(searchResult.customer.lastPaymentDate)
                            : 'No payments yet'}
                        </div>
                      </div>
                    </div>

                    {/* Customer Action Buttons */}
                    <div className="assistant-card-actions">
                      <button
                        type="button"
                        className="assistant-btn-primary"
                        onClick={() =>
                          handleNavigate(`/customers/${searchResult.customer.id}`)
                        }
                      >
                        <ExternalLink size={15} />
                        Open Customer Profile
                      </button>

                      <button
                        type="button"
                        className="assistant-btn-secondary"
                        onClick={() =>
                          handleNavigate(
                            `/purchases/new?customerId=${searchResult.customer.id}`
                          )
                        }
                      >
                        <ShoppingBag size={15} />
                        New Purchase
                      </button>
                    </div>

                    <button
                      type="button"
                      className="assistant-btn-clear"
                      onClick={handleClearSearch}
                    >
                      Search Another Customer
                    </button>
                  </div>
                ) : (
                  /* Customer Not Found Card */
                  <div className="assistant-not-found-card">
                    <div className="assistant-not-found-icon">
                      <AlertCircle size={32} color="#f59e0b" />
                    </div>
                    <div className="assistant-not-found-title">
                      Customer Not Found
                    </div>
                    <p className="assistant-not-found-desc">
                      No customer account matches mobile number{' '}
                      <strong>{searchResult.queriedMobile}</strong>.
                    </p>

                    <div className="assistant-card-actions">
                      <button
                        type="button"
                        className="assistant-btn-primary"
                        onClick={() => handleNavigate('/customers')}
                      >
                        <UserPlus size={16} />
                        Add New Customer
                      </button>

                      <button
                        type="button"
                        className="assistant-btn-clear"
                        onClick={handleClearSearch}
                      >
                        Try Another Number
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Shortcuts (when no search active) */}
            {!searchResult && (
              <div className="assistant-quick-shortcuts">
                <div className="assistant-shortcuts-title">Quick Actions</div>
                <div className="assistant-shortcuts-list">
                  <button
                    type="button"
                    className="assistant-shortcut-item"
                    onClick={() => handleNavigate('/purchases/new')}
                  >
                    <div className="assistant-shortcut-icon primary">
                      <ShoppingBag size={16} />
                    </div>
                    <div className="assistant-shortcut-text">
                      <span>Record New Purchase</span>
                      <small>Sell product with installment plan</small>
                    </div>
                    <ChevronRight size={14} className="assistant-shortcut-chevron" />
                  </button>

                  <button
                    type="button"
                    className="assistant-shortcut-item"
                    onClick={() => handleNavigate('/payments/collect')}
                  >
                    <div className="assistant-shortcut-icon success">
                      <CreditCard size={16} />
                    </div>
                    <div className="assistant-shortcut-text">
                      <span>Collect Payment</span>
                      <small>Record installment or down payment</small>
                    </div>
                    <ChevronRight size={14} className="assistant-shortcut-chevron" />
                  </button>

                  <button
                    type="button"
                    className="assistant-shortcut-item"
                    onClick={() => handleNavigate('/payments/overdue')}
                  >
                    <div className="assistant-shortcut-icon danger">
                      <Clock size={16} />
                    </div>
                    <div className="assistant-shortcut-text">
                      <span>Overdue Accounts</span>
                      <small>View late installments & call list</small>
                    </div>
                    <ChevronRight size={14} className="assistant-shortcut-chevron" />
                  </button>

                  <button
                    type="button"
                    className="assistant-shortcut-item"
                    onClick={() => handleNavigate('/customers')}
                  >
                    <div className="assistant-shortcut-icon info">
                      <User size={16} />
                    </div>
                    <div className="assistant-shortcut-text">
                      <span>Customer Directory</span>
                      <small>Browse all 2,000+ accounts</small>
                    </div>
                    <ChevronRight size={14} className="assistant-shortcut-chevron" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
