const express = require('express');
const { body } = require('express-validator');
const {
  getDashboardMetrics,
  getUsers,
  getAdminRooms,
  getAdminBookings,
  getAdminPayments,
  createStaff
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isStaff } = require('../middleware/roleMiddleware');

const router = express.Router();

// Base protection: all admin routes require authentication
router.use(protect);

// Staff and Admin can view all bookings
router.get('/bookings', isStaff, getAdminBookings);

// Admin-exclusive routes
router.get('/dashboard', isAdmin, getDashboardMetrics);
router.get('/users', isAdmin, getUsers);
router.get('/rooms', isAdmin, getAdminRooms);
router.get('/payments', isAdmin, getAdminPayments);

router.post(
  '/staff',
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Staff name is required'),
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  ],
  createStaff
);

module.exports = router;
