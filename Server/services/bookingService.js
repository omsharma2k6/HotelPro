const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const RoomService = require('./roomService');
const roomLock = require('../utils/roomLock');

/**
 * Booking Engine Service
 * Implements strict date validation, rate snapshots, overlap prevention,
 * and concurrency-safe reservation execution.
 */
class BookingService {
  /**
   * Helper to parse and normalize date to UTC calendar day
   */
  static parseCalendarDate(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      const err = new Error(`Invalid date format: ${dateInput}`);
      err.statusCode = 400;
      throw err;
    }
    return d;
  }

  /**
   * Calculate number of standard hotel nights between two dates
   */
  static calculateNights(checkInDate, checkOutDate) {
    const start = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    const end = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
    const diffMs = end.getTime() - start.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights;
  }

  /**
   * Create a new reservation with concurrency-safe inventory verification
   */
  static async createBooking({
    userId,
    roomId,
    checkInDate,
    checkOutDate,
    guestName,
    guestContactNumber,
    specialRequests = ''
  }) {
    if (!roomId) {
      const err = new Error('Room ID is required');
      err.statusCode = 400;
      throw err;
    }

    const checkIn = this.parseCalendarDate(checkInDate);
    const checkOut = this.parseCalendarDate(checkOutDate);

    // Validate date logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInMidnight = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    if (checkInMidnight < today) {
      const err = new Error('Check-in date cannot be in the past');
      err.statusCode = 400;
      throw err;
    }

    if (checkOut <= checkIn) {
      const err = new Error('Check-out date must be strictly after check-in date');
      err.statusCode = 400;
      throw err;
    }

    const numberOfNights = this.calculateNights(checkIn, checkOut);
    if (numberOfNights < 1) {
      const err = new Error('Reservation must be for at least 1 night');
      err.statusCode = 400;
      throw err;
    }

    // Retrieve trusted room configuration from MongoDB
    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      const err = new Error('Selected room is inactive or not found');
      err.statusCode = 404;
      throw err;
    }

    if (room.status === 'maintenance' || room.status === 'inactive') {
      const err = new Error(`Room cannot be reserved while in '${room.status}' status`);
      err.statusCode = 400;
      throw err;
    }

    // CONCURRENCY-SAFE CRITICAL SECTION:
    // Serialized per room to guarantee no race conditions can overbook inventory
    return await roomLock.acquire(roomId, async () => {
      // Re-verify overlapping bookings count inside the locked critical section
      const activeOverlaps = await RoomService.getOverlappingBookingsCount(roomId, checkIn, checkOut);

      if (activeOverlaps >= room.inventory) {
        const err = new Error('Room is no longer available for the requested dates');
        err.statusCode = 409;
        throw err;
      }

      // Calculate authoritative financial snapshot on the server
      const pricePerNightSnapshot = room.rentPerNight;
      const totalAmount = pricePerNightSnapshot * numberOfNights;

      // Create new booking record
      const booking = await Booking.create({
        user: userId,
        room: roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfNights,
        guestName: guestName.trim(),
        guestContactNumber: guestContactNumber.trim(),
        specialRequests: specialRequests ? specialRequests.trim() : '',
        pricePerNightSnapshot,
        totalAmount,
        bookingStatus: 'pending',
        paymentStatus: 'unpaid'
      });

      return await booking.populate('room');
    });
  }

  /**
   * Retrieve bookings owned by a specific authenticated user
   */
  static async getUserBookings(userId, query = {}) {
    const { page = 1, limit = 10, status } = query;
    const mongoQuery = { user: userId };

    if (status) {
      mongoQuery.bookingStatus = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(mongoQuery)
        .populate('room')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(mongoQuery)
    ]);

    return {
      bookings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }

  /**
   * Retrieve single booking with strict access isolation
   */
  static async getBookingById(bookingId, currentUser) {
    const booking = await Booking.findById(bookingId).populate('room').populate('user', 'name email phone');
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization check: guest can only access their own reservation
    const isOwner = booking.user._id.toString() === currentUser._id.toString();
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';

    if (!isOwner && !isPrivileged) {
      const err = new Error('Access denied: You do not have permission to view this reservation');
      err.statusCode = 403;
      throw err;
    }

    return booking;
  }

  /**
   * Cancel an eligible reservation
   */
  static async cancelBooking(bookingId, currentUser, reason = '') {
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const isOwner = booking.user.toString() === currentUser._id.toString();
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'staff';

    if (!isOwner && !isPrivileged) {
      const err = new Error('Access denied: You can only cancel your own reservation');
      err.statusCode = 403;
      throw err;
    }

    // State transition validations
    if (booking.bookingStatus === 'cancelled') {
      const err = new Error('Reservation is already cancelled');
      err.statusCode = 400;
      throw err;
    }

    if (['checked_in', 'checked_out', 'completed'].includes(booking.bookingStatus)) {
      const err = new Error(`Cannot cancel a reservation with status '${booking.bookingStatus}'`);
      err.statusCode = 400;
      throw err;
    }

    // If guest attempts to cancel after check-in date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInMidnight = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
    
    if (checkInMidnight <= today && !isPrivileged) {
      const err = new Error('Online cancellation is not permitted on or after check-in day. Please contact front desk.');
      err.statusCode = 400;
      throw err;
    }

    // Update status
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || (isOwner ? 'Cancelled by guest' : `Cancelled by ${currentUser.role}`);
    booking.cancelledAt = new Date();

    // If payment was completed, mark refund workflow
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
      await Payment.updateMany(
        { booking: booking._id, paymentStatus: 'completed' },
        { $set: { paymentStatus: 'refunded', 'metadata.refundedAt': new Date().toISOString() } }
      );
    }

    await booking.save();
    return booking;
  }

  /**
   * List all bookings (Admin & Staff operational view)
   */
  static async getAllBookings(query = {}) {
    const {
      page = 1,
      limit = 20,
      bookingStatus,
      paymentStatus,
      search,
      sort = '-createdAt'
    } = query;

    const mongoQuery = {};

    if (bookingStatus) {
      mongoQuery.bookingStatus = bookingStatus;
    }

    if (paymentStatus) {
      mongoQuery.paymentStatus = paymentStatus;
    }

    if (search) {
      mongoQuery.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { guestContactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(mongoQuery)
        .populate('room')
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(mongoQuery)
    ]);

    return {
      bookings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }
}

module.exports = BookingService;
