const express = require('express');
const router = express.Router();
const {
  getPayments,
  recordPayment,
  getPaymentReceipt,
  getPendingPayments,
  getOverduePayments
} = require('../controllers/paymentController');

router.get('/', getPayments);
router.post('/', recordPayment);
router.get('/pending', getPendingPayments);
router.get('/overdue', getOverduePayments);
router.get('/:id/receipt', getPaymentReceipt);

module.exports = router;
