const request = require('supertest');
const { app } = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { generateToken } = require('../utils/jwt');
const { setupTestDB } = require('./setup');

describe('Booking Engine & Concurrency Control Tests', () => {
  setupTestDB();

  let guest1User;
  let guest2User;
  let guest1Token;
  let guest2Token;
  let testRoom;

  beforeEach(async () => {
    const passwordHash = await User.hashPassword('Password123');

    guest1User = await User.create({
      name: 'Guest One',
      email: 'guest1.bookings@hotelpro.test',
      phone: '+15550000001',
      passwordHash,
      role: 'guest'
    });
    guest1Token = generateToken(guest1User);

    guest2User = await User.create({
      name: 'Guest Two',
      email: 'guest2.bookings@hotelpro.test',
      phone: '+15550000002',
      passwordHash,
      role: 'guest'
    });
    guest2Token = generateToken(guest2User);

    testRoom = await Room.create({
      roomNumber: '401',
      roomType: 'Deluxe',
      description: 'Deluxe Suite with Ocean View',
      rentPerNight: 200,
      inventory: 1, // Exactly 1 unit available
      status: 'available',
      isActive: true
    });
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a valid reservation with backend-computed totals and snapshot pricing', async () => {
      // 3 nights: 2026-12-10 to 2026-12-13
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${guest1Token}`)
        .send({
          roomId: testRoom._id.toString(),
          checkInDate: '2026-12-10',
          checkOutDate: '2026-12-13',
          guestName: 'Guest One',
          guestContactNumber: '+15550000001',
          // Malicious client attempts to forge total amount
          totalAmount: 10
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.numberOfNights).toBe(3);
      expect(res.body.booking.pricePerNightSnapshot).toBe(200);
      // Backend must calculate total: 3 * 200 = 600, ignoring client attempt of 10
      expect(res.body.booking.totalAmount).toBe(600);
      expect(res.body.booking.bookingStatus).toBe('pending');
      expect(res.body.booking.paymentStatus).toBe('unpaid');
    });

    it('should reject check-in dates in the past', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${guest1Token}`)
        .send({
          roomId: testRoom._id.toString(),
          checkInDate: '2020-01-01',
          checkOutDate: '2020-01-05',
          guestName: 'Guest One',
          guestContactNumber: '+15550000001'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('past');
    });

    it('should reject check-out dates earlier than or equal to check-in', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${guest1Token}`)
        .send({
          roomId: testRoom._id.toString(),
          checkInDate: '2026-12-15',
          checkOutDate: '2026-12-15', // 0 nights
          guestName: 'Guest One',
          guestContactNumber: '+15550000001'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Ownership Isolation & Cancellation', () => {
    let booking1;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${guest1Token}`)
        .send({
          roomId: testRoom._id.toString(),
          checkInDate: '2026-12-20',
          checkOutDate: '2026-12-25',
          guestName: 'Guest One',
          guestContactNumber: '+15550000001'
        });
      booking1 = res.body.booking;
    });

    it('should forbid Guest Two from viewing Guest One reservation (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${booking1._id}`)
        .set('Authorization', `Bearer ${guest2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('should forbid Guest Two from cancelling Guest One reservation (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${booking1._id}/cancel`)
        .set('Authorization', `Bearer ${guest2Token}`)
        .send({ reason: 'Malicious cancellation attempt' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow Guest One to cancel their reservation and release inventory', async () => {
      // 1. Check availability for overlapping window (should be 0 because booking1 exists)
      const availBefore = await request(app)
        .get('/api/v1/rooms/availability')
        .query({
          roomId: testRoom._id.toString(),
          checkIn: '2026-12-21',
          checkOut: '2026-12-24'
        });
      expect(availBefore.body.availableUnits).toBe(0);

      // 2. Guest One cancels booking
      const cancelRes = await request(app)
        .patch(`/api/v1/bookings/${booking1._id}/cancel`)
        .set('Authorization', `Bearer ${guest1Token}`)
        .send({ reason: 'Trip rescheduled' });

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.booking.bookingStatus).toBe('cancelled');

      // 3. Check availability again (should now be released to 1 unit)
      const availAfter = await request(app)
        .get('/api/v1/rooms/availability')
        .query({
          roomId: testRoom._id.toString(),
          checkIn: '2026-12-21',
          checkOut: '2026-12-24'
        });
      expect(availAfter.body.availableUnits).toBe(1);
    });
  });

  describe('CONCURRENCY-SAFE RESERVATION TEST', () => {
    it('CRITICAL TEST: 10 simultaneous booking attempts for the last unit must result in exactly 1 success and 9 rejections', async () => {
      const checkInDate = '2026-12-25';
      const checkOutDate = '2026-12-30';

      // Launch 10 simultaneous booking requests concurrently
      const concurrentRequests = Array.from({ length: 10 }, (_, index) => {
        return request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${guest1Token}`)
          .send({
            roomId: testRoom._id.toString(),
            checkInDate,
            checkOutDate,
            guestName: `Concurrent Guest ${index}`,
            guestContactNumber: '+15550009999'
          });
      });

      const results = await Promise.all(concurrentRequests);

      // Count successes (201) and conflicts (409)
      const successCount = results.filter((r) => r.statusCode === 201).length;
      const conflictCount = results.filter((r) => r.statusCode === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(9);

      // Assert database integrity: exactly 1 booking exists in MongoDB for this room
      const totalBookingsInDb = await Booking.countDocuments({
        room: testRoom._id,
        bookingStatus: { $in: ['pending', 'confirmed'] }
      });
      expect(totalBookingsInDb).toBe(1);
    });
  });
});
