const Room = require('../models/Room');
const RoomService = require('../services/roomService');

/**
 * Room Controller
 */
const getRooms = async (req, res, next) => {
  try {
    const result = await RoomService.listRooms(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'checkIn and checkOut are required query parameters'
      });
    }

    if (roomId) {
      const availability = await RoomService.checkRoomAvailability(roomId, checkIn, checkOut);
      return res.status(200).json({
        success: true,
        ...availability
      });
    }

    // When roomId is omitted, check availability across all active rooms
    const activeRooms = await Room.find({ isActive: true });
    const roomsWithAvailability = await Promise.all(
      activeRooms.map(async (r) => {
        const avail = await RoomService.checkRoomAvailability(r._id, checkIn, checkOut);
        return {
          _id: r._id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          rentPerNight: r.rentPerNight,
          inventory: r.inventory,
          ...avail
        };
      })
    );

    res.status(200).json({
      success: true,
      checkIn,
      checkOut,
      rooms: roomsWithAvailability
    });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await RoomService.getRoomById(req.params.id, {
      checkIn: req.query.checkIn,
      checkOut: req.query.checkOut
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const room = await RoomService.createRoom(req.body);
    res.status(201).json({
      success: true,
      message: `Room '${room.roomNumber}' created successfully`,
      room
    });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await RoomService.updateRoom(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Room '${room.roomNumber}' updated successfully`,
      room
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const result = await RoomService.deleteRoom(req.params.id);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  getAvailability,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
