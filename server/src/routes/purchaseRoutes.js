const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  previewSchedule
} = require('../controllers/purchaseController');

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.post('/preview-schedule', previewSchedule);

module.exports = router;
