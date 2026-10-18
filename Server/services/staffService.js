const Booking = require('../models/Booking');
const Room = require('../models/Room');

/**
 * Staff Operations Service
 * Guest check-in/check-out lifecycle, housekeeping tracking, and room operational states
 */
class StaffService {
  /**
   * Process guest check-in
   */
  static async checkInGuest(bookingId) {
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.bookingStatus === 'cancelled') {
      const err = new Error('Cannot check in a cancelled reservation');
      err.statusCode = 400;
      throw err;
    }

    if (booking.bookingStatus === 'checked_in') {
      const err = new Error('Guest is already checked in for this reservation');
      err.statusCode = 400;
      throw err;
    }

    if (booking.bookingStatus === 'checked_out' || booking.bookingStatus === 'completed') {
      const err = new Error('This reservation has already been completed');
      err.statusCode = 400;
      throw err;
    }

    // Update booking status
    booking.bookingStatus = 'checked_in';
    booking.checkInTime = new Date();
    await booking.save();

    // Update physical room status to occupied
    await Room.findByIdAndUpdate(booking.room._id, {
      status: 'occupied',
      housekeepingStatus: 'clean'
    });

    return booking;
  }

  /**
   * Process guest check-out
   */
  static async checkOutGuest(bookingId) {
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    if (booking.bookingStatus !== 'checked_in') {
      const err = new Error(`Cannot check out reservation with status '${booking.bookingStatus}'. Guest must be checked in first.`);
      err.statusCode = 400;
      throw err;
    }

    // Transition to checked_out
    booking.bookingStatus = 'checked_out';
    booking.checkOutTime = new Date();
    await booking.save();

    // Mark room available and trigger housekeeping dirty state for cleaning
    await Room.findByIdAndUpdate(booking.room._id, {
      status: 'available',
      housekeepingStatus: 'dirty'
    });

    return booking;
  }

  /**
   * Update room housekeeping or maintenance status
   */
  static async updateRoomHousekeeping(roomId, { housekeepingStatus, status }) {
    const room = await Room.findById(roomId);
    if (!room) {
      const err = new Error('Room not found');
      err.statusCode = 404;
      throw err;
    }

    // Safety guard: cannot mark a room available if currently occupied by an active checked_in guest
    if (status === 'available') {
      const activeStay = await Booking.findOne({
        room: roomId,
        bookingStatus: 'checked_in'
      });
      if (activeStay) {
        const err = new Error(`Cannot set room to 'available' while occupied by active stay (Guest: ${activeStay.guestName})`);
        err.statusCode = 400;
        throw err;
      }
    }

    if (housekeepingStatus) {
      room.housekeepingStatus = housekeepingStatus;
    }

    if (status) {
      room.status = status;
    }

    await room.save();
    return room;
  }

  /**
   * Get housekeeping roster (rooms requiring cleaning or inspection)
   */
  static async getHousekeepingRoster() {
    return await Room.find({
      isActive: true,
      $or: [
        { housekeepingStatus: { $in: ['dirty', 'cleaning_in_progress', 'inspected'] } },
        { status: 'maintenance' }
      ]
    }).sort('roomNumber');
  }
}

module.exports = StaffService;
