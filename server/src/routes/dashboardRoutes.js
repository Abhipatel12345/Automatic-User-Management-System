const express = require('express');
const router = express.Router();
const {
  getDashboardKPIs,
  getCollectionChart,
  getSalesAnalytics,
  getCustomerOverview,
  getAttentionPayments,
  getRecentPayments,
  globalSearch,
  getNotifications
} = require('../controllers/dashboardController');

router.get('/kpis', getDashboardKPIs);
router.get('/collection-chart', getCollectionChart);
router.get('/sales-analytics', getSalesAnalytics);
router.get('/customer-overview', getCustomerOverview);
router.get('/attention', getAttentionPayments);
router.get('/recent-payments', getRecentPayments);
router.get('/search', globalSearch);
router.get('/notifications', getNotifications);

module.exports = router;
