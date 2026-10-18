const express = require('express');
const {
  getPaymentConfig,
  createOrder,
  verifyPayment,
  getPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public configuration route (reports active provider and mode)
router.get('/config', getPaymentConfig);

// Protected payment processing
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// Admin-only payment transactions monitor
router.get('/', protect, isAdmin, getPayments);

module.exports = router;
