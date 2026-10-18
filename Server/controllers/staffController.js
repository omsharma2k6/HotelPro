const StaffService = require('../services/staffService');

/**
 * Staff Controller
 */
const checkInGuest = async (req, res, next) => {
  try {
    const booking = await StaffService.checkInGuest(req.params.id);
    res.status(200).json({
      success: true,
      message: `Guest '${booking.guestName}' checked in successfully`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

const checkOutGuest = async (req, res, next) => {
  try {
    const booking = await StaffService.checkOutGuest(req.params.id);
    res.status(200).json({
      success: true,
      message: `Guest '${booking.guestName}' checked out successfully. Room marked dirty for housekeeping.`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

const getHousekeeping = async (req, res, next) => {
  try {
    const rooms = await StaffService.getHousekeepingRoster();
    res.status(200).json({
      success: true,
      rooms
    });
  } catch (error) {
    next(error);
  }
};

const updateRoomHousekeeping = async (req, res, next) => {
  try {
    const { housekeepingStatus, status } = req.body;
    const room = await StaffService.updateRoomHousekeeping(req.params.id, {
      housekeepingStatus,
      status
    });
    res.status(200).json({
      success: true,
      message: `Room '${room.roomNumber}' updated: Status is '${room.status}', Housekeeping is '${room.housekeepingStatus}'`,
      room
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkInGuest,
  checkOutGuest,
  getHousekeeping,
  updateRoomHousekeeping
};
