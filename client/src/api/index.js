/**
 * API Client Services for Apex ERP
 */

const BASE_URL = '/api';

async function fetchJSON(url, options = {}) {
  const token = localStorage.getItem('apex_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    if (res.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('apex_auth_token');
      localStorage.removeItem('apex_auth_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

// Authentication APIs
export const loginApi = (credentials) => fetchJSON('/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials)
});

export const getMeApi = () => fetchJSON('/auth/me');

// Dashboard APIs
export const getDashboardKPIs = () => fetchJSON('/dashboard/kpis');
export const getCollectionChart = (period = '6m') => fetchJSON(`/dashboard/collection-chart?period=${period}`);
export const getSalesAnalytics = () => fetchJSON('/dashboard/sales-analytics');
export const getCustomerOverview = () => fetchJSON('/dashboard/customer-overview');
export const getAttentionPayments = () => fetchJSON('/dashboard/attention');
export const getRecentPayments = () => fetchJSON('/dashboard/recent-payments');
export const globalSearch = (q) => fetchJSON(`/dashboard/search?q=${encodeURIComponent(q)}`);
export const getNotifications = () => fetchJSON('/dashboard/notifications');

// Customer APIs
export const getCustomers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/customers?${query}`);
};
export const getCustomerById = (id) => fetchJSON(`/customers/${id}`);
export const searchCustomerByMobile = (mobile) => fetchJSON(`/customers/search?mobile=${encodeURIComponent(mobile)}`);
export const createCustomer = async (formData) => {
  const res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    body: formData // multipart/form-data for photo uploads
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Failed to create customer');
  }
  return data;
};
export const updateCustomer = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/customers/${id}`, {
    method: 'PUT',
    body: formData
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Failed to update customer');
  }
  return data;
};
export const deleteCustomer = (id) => fetchJSON(`/customers/${id}`, { method: 'DELETE' });

// Product APIs
export const getProducts = () => fetchJSON('/products');
export const createProduct = (payload) => fetchJSON('/products', { method: 'POST', body: JSON.stringify(payload) });

// Purchase APIs
export const getPurchases = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/purchases?${query}`);
};
export const getPurchaseById = (id) => fetchJSON(`/purchases/${id}`);
export const createPurchase = (payload) => fetchJSON('/purchases', { method: 'POST', body: JSON.stringify(payload) });
export const previewSchedule = (payload) => fetchJSON('/purchases/preview-schedule', { method: 'POST', body: JSON.stringify(payload) });

// Payment APIs
export const getPayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/payments?${query}`);
};
export const recordPayment = (payload) => fetchJSON('/payments', { method: 'POST', body: JSON.stringify(payload) });
export const getPaymentReceipt = (id) => fetchJSON(`/payments/${id}/receipt`);
export const getPendingPayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/payments/pending?${query}`);
};
export const getOverduePayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/payments/overdue?${query}`);
};

// Report APIs
export const getSalesReport = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/reports/sales?${query}`);
};
export const getCollectionReport = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/reports/collection?${query}`);
};
export const getOutstandingReport = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/reports/outstanding?${query}`);
};
export const getCustomerReport = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchJSON(`/reports/customers?${query}`);
};
