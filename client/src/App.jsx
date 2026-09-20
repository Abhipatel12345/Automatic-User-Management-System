import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerProfile from './pages/customers/CustomerProfile';
import PurchaseList from './pages/purchases/PurchaseList';
import NewPurchase from './pages/purchases/NewPurchase';
import PaymentCollection from './pages/payments/PaymentCollection';
import PaymentHistory from './pages/payments/PaymentHistory';
import PendingPayments from './pages/payments/PendingPayments';
import OverduePayments from './pages/payments/OverduePayments';
import Reports from './pages/reports/Reports';
import Settings from './pages/Settings';
import CustomerAssistant from './components/assistant/CustomerAssistant';

function AuthenticatedApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      {/* Persistent Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Persistent Header */}
        <Header
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic Page Router */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/new" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
            <Route path="/purchases" element={<PurchaseList />} />
            <Route path="/purchases/new" element={<NewPurchase />} />
            <Route path="/payments" element={<PaymentHistory />} />
            <Route path="/payments/collect" element={<PaymentCollection />} />
            <Route path="/payments/pending" element={<PendingPayments />} />
            <Route path="/payments/overdue" element={<OverduePayments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Persistent Customer Assistant Widget */}
      <CustomerAssistant />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
