const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const {
  getCustomers,
  getCustomerById,
  searchCustomerByMobile,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

router.get('/search', searchCustomerByMobile);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', upload.single('photo'), createCustomer);
router.put('/:id', upload.single('photo'), updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
