const Room = require('../models/Room');
const Booking = require('../models/Booking');

/**
 * Room Management Service
 * Handles room catalog, inventory validation, and dynamic date availability
 */
class RoomService {
  /**
   * Helper to normalize a date to midnight UTC/local boundary for consistent comparison
   */
  static normalizeDate(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date format: ${dateInput}`);
    }
    return d;
  }

  /**
   * Query overlapping bookings for a room between checkIn and checkOut
   * Overlap Rule: existingCheckIn < requestedCheckOut && existingCheckOut > requestedCheckIn
   * Cancelled bookings are strictly excluded from overlap calculations.
   */
  static async getOverlappingBookingsCount(roomId, checkIn, checkOut, excludeBookingId = null) {
    const checkInDate = this.normalizeDate(checkIn);
    const checkOutDate = this.normalizeDate(checkOut);

    const query = {
      room: roomId,
      bookingStatus: { $in: ['pending', 'confirmed', 'checked_in'] },
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate }
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    return await Booking.countDocuments(query);
  }

  /**
   * Check room availability for a specific date window
   */
  static async checkRoomAvailability(roomId, checkIn, checkOut, excludeBookingId = null) {
    const room = await Room.findById(roomId);
    if (!room || !room.isActive || room.status === 'maintenance' || room.status === 'inactive') {
      return {
        isAvailable: false,
        availableUnits: 0,
        totalInventory: room ? room.inventory : 0,
        reason: !room ? 'Room not found' : `Room status is ${room.status}`
      };
    }

    const checkInDate = this.normalizeDate(checkIn);
    const checkOutDate = this.normalizeDate(checkOut);

    if (checkOutDate <= checkInDate) {
      throw new Error('Check-out date must be strictly after check-in date');
    }

    const overlappingCount = await this.getOverlappingBookingsCount(
      roomId,
      checkInDate,
      checkOutDate,
      excludeBookingId
    );

    const availableUnits = Math.max(0, room.inventory - overlappingCount);

    return {
      isAvailable: availableUnits > 0,
      availableUnits,
      totalInventory: room.inventory,
      activeOverlaps: overlappingCount
    };
  }

  /**
   * List rooms with pagination, search, sorting, and optional date-availability filtering
   */
  static async listRooms(query = {}) {
    const {
      page = 1,
      limit = 10,
      roomType,
      minPrice,
      maxPrice,
      amenities,
      status,
      search,
      sort = '-createdAt',
      checkIn,
      checkOut,
      includeInactive = false
    } = query;

    const mongoQuery = {};

    if (!includeInactive) {
      mongoQuery.isActive = true;
    }

    if (status) {
      mongoQuery.status = status;
    }

    if (roomType) {
      mongoQuery.roomType = roomType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      mongoQuery.rentPerNight = {};
      if (minPrice !== undefined) mongoQuery.rentPerNight.$gte = Number(minPrice);
      if (maxPrice !== undefined) mongoQuery.rentPerNight.$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenityList = Array.isArray(amenities)
        ? amenities
        : amenities.split(',').map((a) => a.trim());
      mongoQuery.amenities = { $all: amenityList };
    }

    if (search) {
      mongoQuery.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // If dates are provided, filter dynamically by date availability
    if (checkIn && checkOut) {
      const checkInDate = this.normalizeDate(checkIn);
      const checkOutDate = this.normalizeDate(checkOut);

      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be strictly after check-in date');
      }

      // Fetch all candidate rooms matching static criteria
      const allMatchingRooms = await Room.find(mongoQuery).sort(sort);

      // Filter by availability for these dates
      const availableRoomsWithMeta = [];
      for (const room of allMatchingRooms) {
        if (room.status === 'maintenance' || room.status === 'inactive') continue;

        const overlaps = await this.getOverlappingBookingsCount(room._id, checkInDate, checkOutDate);
        const availableUnits = Math.max(0, room.inventory - overlaps);

        if (availableUnits > 0) {
          const roomObj = room.toObject();
          roomObj.availableUnits = availableUnits;
          availableRoomsWithMeta.push(roomObj);
        }
      }

      const total = availableRoomsWithMeta.length;
      const paginatedRooms = availableRoomsWithMeta.slice(skip, skip + limitNum);

      return {
        rooms: paginatedRooms,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1
      };
    }

    const [rooms, total] = await Promise.all([
      Room.find(mongoQuery).sort(sort).skip(skip).limit(limitNum),
      Room.countDocuments(mongoQuery)
    ]);

    return {
      rooms,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }

  /**
   * Retrieve room details by ID, with optional date availability preview
   */
  static async getRoomById(id, { checkIn, checkOut } = {}) {
    const room = await Room.findById(id);
    if (!room) {
      return null;
    }

    const roomObj = room.toObject();

    if (checkIn && checkOut) {
      const availability = await this.checkRoomAvailability(room._id, checkIn, checkOut);
      roomObj.availability = availability;
      roomObj.availableUnits = availability.availableUnits;
    }

    return roomObj;
  }

  /**
   * Create a new room record (Admin privilege)
   */
  static async createRoom(data) {
    const { roomNumber, roomType, description, photos, rentPerNight, inventory, amenities, status } = data;

    const normalizedRoomNumber = String(roomNumber).trim().toUpperCase();
    const existing = await Room.findOne({ roomNumber: normalizedRoomNumber });
    if (existing) {
      throw new Error(`Room number '${normalizedRoomNumber}' is already registered`);
    }

    return await Room.create({
      roomNumber: normalizedRoomNumber,
      roomType,
      description,
      photos: Array.isArray(photos) ? photos : [],
      rentPerNight: Number(rentPerNight),
      inventory: inventory ? Math.max(1, Number(inventory)) : 1,
      amenities: Array.isArray(amenities) ? amenities : [],
      status: status || 'available',
      isActive: true
    });
  }

  /**
   * Update room specifications (Admin / Staff privilege)
   */
  static async updateRoom(id, updateData) {
    const room = await Room.findById(id);
    if (!room) {
      throw new Error('Room not found');
    }

    if (updateData.roomNumber) {
      const normalizedNumber = String(updateData.roomNumber).trim().toUpperCase();
      if (normalizedNumber !== room.roomNumber) {
        const duplicate = await Room.findOne({ roomNumber: normalizedNumber });
        if (duplicate) {
          throw new Error(`Room number '${normalizedNumber}' is already in use`);
        }
        room.roomNumber = normalizedNumber;
      }
    }

    const allowedFields = [
      'roomType',
      'description',
      'photos',
      'rentPerNight',
      'inventory',
      'amenities',
      'status',
      'housekeepingStatus',
      'isActive'
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        room[field] = updateData[field];
      }
    });

    return await room.save();
  }

  /**
   * Delete or archive room safely
   * If existing historical bookings exist, archives the room to maintain relational integrity.
   */
  static async deleteRoom(id) {
    const room = await Room.findById(id);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if historical or current bookings exist
    const bookingCount = await Booking.countDocuments({ room: id });

    if (bookingCount > 0) {
      // Historical references exist -> soft-archive to prevent breaking booking history
      room.isActive = false;
      room.status = 'inactive';
      await room.save();
      return {
        action: 'archived',
        message: `Room '${room.roomNumber}' has ${bookingCount} historical reservation(s) and was safely archived rather than deleted.`,
        room
      };
    }

    // No historical references -> safe permanent deletion
    await Room.findByIdAndDelete(id);
    return {
      action: 'deleted',
      message: `Room '${room.roomNumber}' was permanently removed.`,
      room
    };
  }
}

module.exports = RoomService;
