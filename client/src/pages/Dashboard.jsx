import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Eye,
  PlusCircle,
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import {
  getDashboardKPIs,
  getCollectionChart,
  getSalesAnalytics,
  getCustomerOverview,
  getAttentionPayments,
  getRecentPayments
} from '../api';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/formatters';
import ReceiptModal from '../components/receipt/ReceiptModal';

export default function Dashboard() {
  const navigate = useNavigate();

  const [kpiData, setKpiData] = useState(null);
  const [collectionData, setCollectionData] = useState([]);
  const [collectionPeriod, setCollectionPeriod] = useState('6m');
  const [salesAnalytics, setSalesAnalytics] = useState([]);
  const [customerOverview, setCustomerOverview] = useState(null);
  const [attentionPayments, setAttentionPayments] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Receipt Modal state
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    getCollectionChart(collectionPeriod)
      .then((res) => setCollectionData(res.data || []))
      .catch((err) => console.error(err));
  }, [collectionPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpis, collection, sales, overview, attention, recent] = await Promise.all([
        getDashboardKPIs(),
        getCollectionChart(collectionPeriod),
        getSalesAnalytics(),
        getCustomerOverview(),
        getAttentionPayments(),
        getRecentPayments()
      ]);

      setKpiData(kpis.data);
      setCollectionData(collection.data || []);
      setSalesAnalytics(sales.data || []);
      setCustomerOverview(overview.data);
      setAttentionPayments(attention.data || []);
      setRecentPayments(recent.data || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Max value for collection chart scaling
  const maxCollectionVal = Math.max(
    ...collectionData.map((d) => Math.max(d.collected, d.pending, d.overdue)),
    10000
  );

  // Max value for sales chart
  const maxSalesVal = Math.max(...salesAnalytics.map((s) => s.sales), 10000);

  return (
    <div className="content-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <span>Executive ERP Dashboard</span>
          </h1>
          <p>Real-time customer sales, installment schedules, and cashflow analytics</p>
        </div>
        <div className="page-actions">
          <Link to="/customers/new" className="btn btn-secondary">
            <PlusCircle size={16} />
            Add Customer
          </Link>
          <Link to="/purchases/new" className="btn btn-secondary">
            <ShoppingBag size={16} />
            New Purchase
          </Link>
          <Link to="/payments/collect" className="btn btn-primary">
            <CreditCard size={16} />
            Record Payment
          </Link>
        </div>
      </div>

      {/* 1. 6 Executive KPI Cards */}
      <div className="kpi-grid">
        {/* Total Customers */}
        <div className="kpi-card" style={{ '--accent-color': '#38bdf8', '--accent-bg': 'rgba(56, 189, 248, 0.12)' }}>
          <div className="kpi-top">
            <span className="kpi-title">Total Customers</span>
            <div className="kpi-icon-box">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : kpiData?.totalCustomers || 0}</div>
          <div className="kpi-footer">
            <span className="trend-badge trend-positive">
              <ArrowUpRight size={12} /> {kpiData?.trends?.customerGrowth || '+18%'}
            </span>
            <span>managed accounts</span>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="kpi-card" style={{ '--accent-color': '#a855f7', '--accent-bg': 'rgba(168, 85, 247, 0.12)' }}>
          <div className="kpi-top">
            <span className="kpi-title">Total Purchases</span>
            <div className="kpi-icon-box">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : kpiData?.totalPurchases || 0}</div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-secondary)' }}>Orders & installment plans</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="kpi-card" style={{ '--accent-color': '#6366f1', '--accent-bg': 'rgba(99, 102, 241, 0.12)' }}>
          <div className="kpi-top">
            <span className="kpi-title">Total Sales</span>
            <div className="kpi-icon-box">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '—' : formatCompactCurrency(kpiData?.totalSales)}</div>
          <div className="kpi-footer">
            <span className="trend-badge trend-positive">
              <ArrowUpRight size={12} /> {kpiData?.trends?.salesTrend || '+12%'}
            </span>
            <span>gross invoiced</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="kpi-card" style={{ '--accent-color': '#10b981', '--accent-bg': 'rgba(16, 185, 129, 0.12)' }}>
          <div className="kpi-top">
            <span className="kpi-title">Total Collected</span>
            <div className="kpi-icon-box">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>
            {loading ? '—' : formatCompactCurrency(kpiData?.totalCollected)}
          </div>
          <div className="kpi-footer">
            <span className="trend-badge trend-positive">
              <ArrowUpRight size={12} /> {kpiData?.trends?.collectionTrend || '+8%'}
            </span>
            <span>realized cashflow</span>
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="kpi-card" style={{ '--accent-color': '#f59e0b', '--accent-bg': 'rgba(245, 158, 11, 0.12)' }}>
          <div className="kpi-top">
            <span className="kpi-title">Outstanding Amount</span>
            <div className="kpi-icon-box">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>
            {loading ? '—' : formatCompactCurrency(kpiData?.outstandingAmount)}
          </div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--text-secondary)' }}>Pending future balance</span>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="kpi-card" style={{ '--accent-color': '#ef4444', '--accent-bg': 'rgba(239, 68, 68, 0.12)' }}>
          <div className="kpi-top">
            <span className="kpi-title">Overdue Amount</span>
            <div className="kpi-icon-box">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>
            {loading ? '—' : formatCompactCurrency(kpiData?.overdueAmount)}
          </div>
          <div className="kpi-footer">
            <span className="trend-badge trend-negative">Attention required</span>
          </div>
        </div>
      </div>

      {/* 2. Charts Row: Monthly Collection + Sales Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Collection Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Collection Overview</div>
              <div className="card-subtitle">Actual collection vs pending & overdue balances</div>
            </div>
            {/* Filter pills */}
            <div className="filter-group">
              {[
                { label: '7 Days', val: '7d' },
                { label: 'This Month', val: 'this_month' },
                { label: '6 Months', val: '6m' },
                { label: 'This Year', val: 'this_year' }
              ].map((f) => (
                <button
                  key={f.val}
                  className={`btn btn-sm ${collectionPeriod === f.val ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCollectionPeriod(f.val)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                <span>Collected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
                <span>Pending</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
                <span>Overdue</span>
              </div>
            </div>

            {/* Custom Interactive SVG Chart */}
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingTop: '10px' }}>
              {collectionData.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>No data for selected period</div>
              ) : (
                collectionData.map((d, i) => {
                  const hCollected = (d.collected / maxCollectionVal) * 160;
                  const hPending = (d.pending / maxCollectionVal) * 160;
                  const hOverdue = (d.overdue / maxCollectionVal) * 160;

                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }}>
                        {/* Collected bar */}
                        <div
                          title={`Collected: ${formatCurrency(d.collected)}`}
                          style={{
                            width: '30%',
                            height: `${Math.max(4, hCollected)}px`,
                            backgroundColor: '#10b981',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease'
                          }}
                        />
                        {/* Pending bar */}
                        <div
                          title={`Pending: ${formatCurrency(d.pending)}`}
                          style={{
                            width: '30%',
                            height: `${Math.max(4, hPending)}px`,
                            backgroundColor: '#f59e0b',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease'
                          }}
                        />
                        {/* Overdue bar */}
                        <div
                          title={`Overdue: ${formatCurrency(d.overdue)}`}
                          style={{
                            width: '30%',
                            height: `${Math.max(4, hOverdue)}px`,
                            backgroundColor: '#ef4444',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                        {d.label}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sales Analytics Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Sales Growth Trends</div>
              <div className="card-subtitle">Monthly total sales volume and purchase count</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingTop: '10px' }}>
              {salesAnalytics.map((s, idx) => {
                const hSales = (s.sales / maxSalesVal) * 160;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                      {formatCompactCurrency(s.sales)}
                    </div>
                    <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div
                        title={`${s.month}: ${formatCurrency(s.sales)} (${s.purchaseCount} purchases)`}
                        style={{
                          width: '45%',
                          height: `${Math.max(8, hSales)}px`,
                          background: 'linear-gradient(180deg, #6366f1, #4338ca)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.4s ease'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      {s.month}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {s.purchaseCount} orders
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customer Overview Donut / Breakdown */}
      {customerOverview && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Customer Distribution & Health</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total Database: <strong>{customerOverview.totalCustomers} Customers</strong>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Customers
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '4px' }}>
                  {customerOverview.activeCustomers}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>With active purchases</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Fully Paid
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                  {customerOverview.fullyPaidCustomers}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Zero pending balance</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Pending Installments
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                  {customerOverview.pendingCustomers}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>On-time repayment schedule</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Overdue Accounts
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>
                  {customerOverview.overdueCustomers}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Requires immediate follow-up</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--info)', textTransform: 'uppercase', fontWeight: 700 }}>
                  New Registrations
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info)', marginTop: '4px' }}>
                  {customerOverview.newCustomers}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Registered in last 30 days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payments Requiring Attention */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              Payments Requiring Attention
            </div>
            <div className="card-subtitle">Pending, partial, and overdue installments sorted by urgency</div>
          </div>
          <Link to="/payments/overdue" className="btn btn-outline btn-sm">
            View All Overdue ({attentionPayments.length})
          </Link>
        </div>
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Product</th>
                <th>Due Date</th>
                <th>Due Amount</th>
                <th>Days Overdue</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {attentionPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No payments currently requiring attention. All accounts are up to date!
                  </td>
                </tr>
              ) : (
                attentionPayments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                        {item.customer.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {item.customer.customerCode}
                      </div>
                    </td>
                    <td>{item.customer.mobile}</td>
                    <td>{item.productName}</td>
                    <td>{formatDate(item.dueDate)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-white)' }}>
                      {formatCurrency(item.dueAmount)}
                    </td>
                    <td>
                      {item.daysOverdue > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                          {item.daysOverdue} days
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Due soon</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/customers/${item.customer.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 10px' }}
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Recent Payments Feed */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              Recent Payments & Collections
            </div>
            <div className="card-subtitle">Latest payments processed across retail counters</div>
          </div>
          <Link to="/payments" className="btn btn-outline btn-sm">
            View All Payments
          </Link>
        </div>
        <div className="table-responsive">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer</th>
                <th>Payment Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Product / Item</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>
                      {p.receiptNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.customer.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {p.customer.customerCode}
                    </div>
                  </td>
                  <td>{formatDate(p.paymentDate)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                    {formatCurrency(p.amount)}
                  </td>
                  <td>
                    <span style={{ backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td>{p.productName}</td>
                  <td>
                    <span className="status-badge badge-paid">Paid</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedReceiptId(p.id)}
                      title="View & Print Receipt"
                    >
                      <FileText size={14} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
