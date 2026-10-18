const mongoose = require('mongoose');

/**
 * Room Schema
 * 
 * Documentation on Room Inventory Model:
 * In HotelPro, `roomNumber` represents an individual room identifier (or room class code).
 * The `inventory` field defines the baseline total number of physical room units that belong
 * to this room configuration.
 * 
 * IMPORTANT: In accordance with hospitality booking architecture, `inventory` represents the
 * total capacity of this room category, NOT date-specific real-time availability. Real-time
 * reservation availability for check-in/check-out date ranges is computed dynamically by
 * aggregating confirmed and active bookings for the specified date window against this baseline
 * inventory count. The baseline inventory is never decremented during booking creation.
 */
const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number or code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Room number cannot exceed 20 characters']
    },
    roomType: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: ['Single', 'Double', 'Deluxe', 'Suite'],
        message: '{VALUE} is not a valid room type'
      }
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    photos: {
      type: [String],
      default: []
    },
    rentPerNight: {
      type: Number,
      required: [true, 'Rent per night is required'],
      min: [0, 'Rent per night cannot be negative']
    },
    inventory: {
      type: Number,
      required: [true, 'Inventory count is required'],
      min: [1, 'Inventory must be at least 1 unit'],
      default: 1
    },
    amenities: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'occupied', 'maintenance', 'inactive'],
        message: '{VALUE} is not a valid room status'
      },
      default: 'available'
    },
    housekeepingStatus: {
      type: String,
      enum: {
        values: ['clean', 'dirty', 'inspected', 'cleaning_in_progress'],
        message: '{VALUE} is not a valid housekeeping status'
      },
      default: 'clean'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Helpful indexes for querying rooms
roomSchema.index({ roomType: 1, status: 1, isActive: 1 });
roomSchema.index({ rentPerNight: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
