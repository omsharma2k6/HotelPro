const BookingService = require('../services/bookingService');

/**
 * Booking Controller
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      guestName,
      guestContactNumber,
      specialRequests
    } = req.body;

    // Strict security: use authoritative authenticated user ID from verified token
    const userId = req.user._id;

    // Use current user's name/phone if not provided in request body
    const finalGuestName = guestName || req.user.name;
    const finalContact = guestContactNumber || req.user.phone;

    if (!finalGuestName || !finalContact) {
      return res.status(400).json({
        success: false,
        message: 'Guest name and contact phone number are required'
      });
    }

    const booking = await BookingService.createBooking({
      userId,
      roomId,
      checkInDate,
      checkOutDate,
      guestName: finalGuestName,
      guestContactNumber: finalContact,
      specialRequests
    });

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const result = await BookingService.getUserBookings(req.user._id, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await BookingService.getBookingById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await BookingService.cancelBooking(req.params.id, req.user, reason);
    res.status(200).json({
      success: true,
      message: 'Reservation successfully cancelled and inventory released.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
