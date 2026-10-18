const express = require('express');
const {
  checkInGuest,
  checkOutGuest,
  getHousekeeping,
  updateRoomHousekeeping
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { isStaff } = require('../middleware/roleMiddleware');

const router = express.Router();

// Staff and Admin operations
router.use(protect, isStaff);

router.patch('/bookings/:id/check-in', checkInGuest);
router.patch('/bookings/:id/checkin', checkInGuest);
router.patch('/bookings/:id/check-out', checkOutGuest);
router.patch('/bookings/:id/checkout', checkOutGuest);
router.get('/housekeeping', getHousekeeping);
router.patch('/rooms/:id/housekeeping', updateRoomHousekeeping);

module.exports = router;
