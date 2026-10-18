const express = require('express');
const { body } = require('express-validator');
const {
  getRooms,
  getAvailability,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isStaff } = require('../middleware/roleMiddleware');

const router = express.Router();

const roomValidationRules = [
  body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
  body('roomType')
    .notEmpty()
    .withMessage('Room type is required')
    .isIn(['Single', 'Double', 'Deluxe', 'Suite'])
    .withMessage('Room type must be Single, Double, Deluxe, or Suite'),
  body('rentPerNight')
    .isFloat({ min: 0 })
    .withMessage('Rent per night must be a non-negative number'),
  body('inventory')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Inventory must be at least 1 unit'),
  body('description').trim().notEmpty().withMessage('Description is required')
];

// Public room browsing and availability
router.get('/', getRooms);
router.get('/availability', getAvailability);
router.get('/:id', getRoomById);

// Admin-restricted room creation and deletion
router.post('/', protect, isAdmin, roomValidationRules, createRoom);
router.delete('/:id', protect, isAdmin, deleteRoom);

// Staff and Admin room modification
router.patch('/:id', protect, isStaff, updateRoom);

module.exports = router;
