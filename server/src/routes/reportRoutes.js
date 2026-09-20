const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getCollectionReport,
  getOutstandingReport,
  getCustomerReport
} = require('../controllers/reportController');

router.get('/sales', getSalesReport);
router.get('/collection', getCollectionReport);
router.get('/outstanding', getOutstandingReport);
router.get('/customers', getCustomerReport);

module.exports = router;
