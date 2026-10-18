const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const bookingValidationRules = [
  body('roomId').trim().notEmpty().withMessage('Room ID is required'),
  body('checkInDate').notEmpty().withMessage('Check-in date is required'),
  body('checkOutDate').notEmpty().withMessage('Check-out date is required')
];

// All booking routes require authentication
router.use(protect);

router.post('/', bookingValidationRules, createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
