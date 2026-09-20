import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShoppingBag,
  PlusCircle,
  CreditCard,
  Receipt,
  Clock,
  AlertOctagon,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="brand-title">
            <div className="brand-icon-box">
              <ShieldCheck size={20} color="white" />
            </div>
            <span>Apex ERP</span>
          </div>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Dashboard"
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* Customers Section */}
        {!collapsed && <div className="nav-section-title">Customers</div>}
        <NavLink
          to="/customers"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="All Customers"
        >
          <Users size={18} />
          {!collapsed && <span>All Customers</span>}
        </NavLink>
        <NavLink
          to="/customers/new"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Add Customer"
        >
          <UserPlus size={18} />
          {!collapsed && <span>Add Customer</span>}
        </NavLink>

        {/* Purchases Section */}
        {!collapsed && <div className="nav-section-title">Purchases</div>}
        <NavLink
          to="/purchases"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="All Purchases"
        >
          <ShoppingBag size={18} />
          {!collapsed && <span>All Purchases</span>}
        </NavLink>
        <NavLink
          to="/purchases/new"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="New Purchase"
        >
          <PlusCircle size={18} />
          {!collapsed && <span>New Purchase</span>}
        </NavLink>

        {/* Payments Section */}
        {!collapsed && <div className="nav-section-title">Payments</div>}
        <NavLink
          to="/payments/collect"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Payment Collection"
        >
          <CreditCard size={18} />
          {!collapsed && <span>Payment Collection</span>}
        </NavLink>
        <NavLink
          to="/payments"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Payment History"
        >
          <Receipt size={18} />
          {!collapsed && <span>Payment History</span>}
        </NavLink>
        <NavLink
          to="/payments/pending"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Pending Payments"
        >
          <Clock size={18} />
          {!collapsed && <span>Pending Payments</span>}
        </NavLink>
        <NavLink
          to="/payments/overdue"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Overdue Payments"
        >
          <AlertOctagon size={18} />
          {!collapsed && <span>Overdue Payments</span>}
        </NavLink>

        {/* Reports Section */}
        {!collapsed && <div className="nav-section-title">Reports</div>}
        <NavLink
          to="/reports"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Reports"
        >
          <BarChart3 size={18} />
          {!collapsed && <span>Reports & Analytics</span>}
        </NavLink>

        {/* Settings */}
        {!collapsed && <div className="nav-section-title">System</div>}
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="Settings"
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </nav>

      {/* Sidebar Footer with Logout */}
      <div style={{
        padding: collapsed ? '12px 8px' : '14px 16px',
        borderTop: '1px solid var(--border-color, #334155)',
        marginTop: 'auto'
      }}>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s'
          }}
          title="Log Out"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
