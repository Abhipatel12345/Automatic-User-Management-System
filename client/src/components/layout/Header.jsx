import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Calendar, User, CheckCircle, AlertTriangle, Clock, X, Menu, LogOut, ChevronDown } from 'lucide-react';
import { globalSearch, getNotifications } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Today's formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  // Load notifications
  useEffect(() => {
    getNotifications()
      .then((res) => {
        if (res.data) {
          setNotifications(res.data);
          setUnreadCount(res.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await globalSearch(searchQuery);
        setSearchResults(res.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (customerId) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(`/customers/${customerId}`);
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar Menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search */}
        <div className="global-search-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer, mobile or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="search-dropdown">
              {isSearching ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Searching records...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((cust) => (
                  <div
                    key={cust.id}
                    className="search-result-item"
                    onClick={() => handleSelectCustomer(cust.id)}
                  >
                    <img
                      src={cust.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cust.name}`}
                      alt={cust.name}
                      style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-white)' }}>
                          {cust.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {cust.customerCode}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        📞 {cust.mobile} {cust.city ? `• ${cust.city}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No customer matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Date Display */}
        <div className="date-badge">
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          <span>{todayFormatted}</span>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="notification-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '320px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 60,
                padding: '8px'
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Live Alerts</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      gap: '10px',
                      fontSize: '0.82rem'
                    }}
                  >
                    {n.type === 'overdue' ? (
                      <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                    ) : n.type === 'due_soon' ? (
                      <Clock size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <div
            className="user-profile-badge"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Account Menu"
          >
            <div className="user-avatar" style={{ backgroundColor: 'var(--primary, #2563eb)', color: '#ffffff', fontWeight: 700 }}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AP'}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-white)' }}>
                {user?.name || 'Abhay Patil'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user?.email || 'patilabhay717@gmail.com'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '4px', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '260px',
                backgroundColor: 'var(--bg-surface, #1e293b)',
                border: '1px solid var(--border-hover, #475569)',
                borderRadius: 'var(--radius-md, 12px)',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.5)',
                zIndex: 70,
                overflow: 'hidden'
              }}
            >
              {/* User info card in dropdown */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color, #334155)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-white, #ffffff)' }}>
                  {user?.name || 'Abhay Patil'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {user?.email || 'patilabhay717@gmail.com'}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <div style={{ padding: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} />
                  <span>Log Out of ERP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
