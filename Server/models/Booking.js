const mongoose = require('mongoose');

/**
 * Booking Schema
 * 
 * Documentation on Pricing and Concurrency:
 * In accordance with HotelPro architecture, `pricePerNightSnapshot` records the historical
 * rate per night frozen at the moment of booking creation. The final `totalAmount` must be
 * computed on the backend (e.g. pricePerNightSnapshot * numberOfNights + applicable taxes),
 * and client-supplied pricing or availability is never accepted as authoritative.
 * Module 2 will implement the booking workflow, date-overlap concurrency checks, and inventory verification.
 */
const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required']
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required']
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required']
    },
    numberOfNights: {
      type: Number,
      required: [true, 'Number of nights is required'],
      min: [1, 'Booking must be for at least 1 night']
    },
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      maxlength: [100, 'Guest name cannot exceed 100 characters']
    },
    guestContactNumber: {
      type: String,
      required: [true, 'Guest contact number is required'],
      trim: true,
      maxlength: [20, 'Contact number cannot exceed 20 characters']
    },
    pricePerNightSnapshot: {
      type: Number,
      required: [true, 'Price per night snapshot is required'],
      min: [0, 'Snapshot price cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    bookingStatus: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'],
        message: '{VALUE} is not a valid booking status'
      },
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'partially_paid', 'paid', 'refunded'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'unpaid'
    }
  },
  {
    timestamps: true
  }
);

// Indexes to optimize reservation queries and conflict detection
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1, bookingStatus: 1 });
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
