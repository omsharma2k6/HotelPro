const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { setupTestDB } = require('./setup');

describe('Core Hotel Data Models Validation Tests', () => {
  setupTestDB();

  let testUser;
  let testRoom;

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Guest Tester',
      email: 'tester@example.com',
      phone: '1234567890',
      passwordHash: 'dummyhash',
      role: 'guest'
    });

    testRoom = await Room.create({
      roomNumber: '101',
      roomType: 'Deluxe',
      description: 'A luxurious deluxe room with ocean view.',
      photos: ['https://example.com/photo1.jpg'],
      rentPerNight: 150,
      inventory: 2,
      amenities: ['WiFi', 'Air Conditioning', 'King Bed'],
      status: 'available'
    });
  });

  describe('Room Model', () => {
    it('should create a valid room with proper fields', async () => {
      expect(testRoom._id).toBeDefined();
      expect(testRoom.roomNumber).toBe('101');
      expect(testRoom.roomType).toBe('Deluxe');
      expect(testRoom.inventory).toBe(2);
      expect(testRoom.status).toBe('available');
    });

    it('should reject room with negative rentPerNight', async () => {
      const invalidRoom = new Room({
        roomNumber: '102',
        roomType: 'Single',
        description: 'Single room',
        rentPerNight: -50,
        inventory: 1
      });

      await expect(invalidRoom.validate()).rejects.toThrow();
    });

    it('should reject room with inventory count less than 1', async () => {
      const invalidRoom = new Room({
        roomNumber: '103',
        roomType: 'Single',
        description: 'Single room',
        rentPerNight: 100,
        inventory: 0
      });

      await expect(invalidRoom.validate()).rejects.toThrow();
    });

    it('should reject invalid roomType not in enum', async () => {
      const invalidRoom = new Room({
        roomNumber: '104',
        roomType: 'PresidentialPalace', // Not in ['Single', 'Double', 'Deluxe', 'Suite']
        description: 'Luxury suite',
        rentPerNight: 500,
        inventory: 1
      });

      await expect(invalidRoom.validate()).rejects.toThrow();
    });
  });

  describe('Booking Model', () => {
    it('should create a valid booking referencing User and Room', async () => {
      const booking = await Booking.create({
        user: testUser._id,
        room: testRoom._id,
        checkInDate: new Date('2026-11-01'),
        checkOutDate: new Date('2026-11-05'),
        numberOfNights: 4,
        guestName: 'Guest Tester',
        guestContactNumber: '1234567890',
        pricePerNightSnapshot: 150,
        totalAmount: 600,
        bookingStatus: 'confirmed',
        paymentStatus: 'unpaid'
      });

      expect(booking._id).toBeDefined();
      expect(booking.numberOfNights).toBe(4);
      expect(booking.totalAmount).toBe(600);
      expect(booking.bookingStatus).toBe('confirmed');
    });

    it('should reject booking with 0 or negative nights', async () => {
      const invalidBooking = new Booking({
        user: testUser._id,
        room: testRoom._id,
        checkInDate: new Date('2026-11-01'),
        checkOutDate: new Date('2026-11-01'),
        numberOfNights: 0,
        guestName: 'Guest Tester',
        guestContactNumber: '1234567890',
        pricePerNightSnapshot: 150,
        totalAmount: 150
      });

      await expect(invalidBooking.validate()).rejects.toThrow();
    });
  });

  describe('Payment Model & PCI-DSS Safety', () => {
    it('should create a valid payment linked to booking', async () => {
      const booking = await Booking.create({
        user: testUser._id,
        room: testRoom._id,
        checkInDate: new Date('2026-11-01'),
        checkOutDate: new Date('2026-11-05'),
        numberOfNights: 4,
        guestName: 'Guest Tester',
        guestContactNumber: '1234567890',
        pricePerNightSnapshot: 150,
        totalAmount: 600
      });

      const payment = await Payment.create({
        booking: booking._id,
        paymentProvider: 'mock',
        amount: 600,
        currency: 'USD',
        paymentStatus: 'completed',
        metadata: { transactionRef: 'MOCK_TXN_12345' }
      });

      expect(payment._id).toBeDefined();
      expect(payment.amount).toBe(600);
      expect(payment.paymentStatus).toBe('completed');
    });

    it('SECURITY CHECK: Payment schema must not contain credit card number or CVV fields', () => {
      const schemaPaths = Object.keys(Payment.schema.paths);
      expect(schemaPaths).not.toContain('cardNumber');
      expect(schemaPaths).not.toContain('creditCardNumber');
      expect(schemaPaths).not.toContain('cvv');
      expect(schemaPaths).not.toContain('cvc');
      expect(schemaPaths).not.toContain('pin');
    });
  });
});
