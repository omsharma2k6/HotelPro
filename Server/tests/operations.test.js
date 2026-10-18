const request = require('supertest');
const { app } = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { generateToken } = require('../utils/jwt');
const { setupTestDB } = require('./setup');

describe('Admin & Staff Operational Workflows Tests', () => {
  setupTestDB();

  let adminToken;
  let staffToken;
  let guestToken;
  let testRoom;
  let testBooking;

  beforeEach(async () => {
    const passwordHash = await User.hashPassword('Password123');

    const adminUser = await User.create({
      name: 'Operations Admin',
      email: 'ops.admin@hotelpro.test',
      phone: '+15551000000',
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    const staffUser = await User.create({
      name: 'Operations Staff',
      email: 'ops.staff@hotelpro.test',
      phone: '+15551000001',
      passwordHash,
      role: 'staff'
    });
    staffToken = generateToken(staffUser);

    const guestUser = await User.create({
      name: 'Operations Guest',
      email: 'ops.guest@hotelpro.test',
      phone: '+15551000002',
      passwordHash,
      role: 'guest'
    });
    guestToken = generateToken(guestUser);

    testRoom = await Room.create({
      roomNumber: '601',
      roomType: 'Deluxe',
      description: 'Operations Test Room',
      rentPerNight: 200,
      inventory: 2,
      status: 'available',
      housekeepingStatus: 'clean'
    });

    testBooking = await Booking.create({
      user: guestUser._id,
      room: testRoom._id,
      checkInDate: new Date('2026-11-20'),
      checkOutDate: new Date('2026-11-25'),
      numberOfNights: 5,
      guestName: 'Operations Guest',
      guestContactNumber: '+15551000002',
      pricePerNightSnapshot: 200,
      totalAmount: 1000,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid'
    });

    await Payment.create({
      booking: testBooking._id,
      amount: 1000,
      currency: 'USD',
      paymentStatus: 'completed'
    });
  });

  describe('GET /api/v1/admin/dashboard (Live Telemetry)', () => {
    it('should calculate live metrics from MongoDB records', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.rooms.total).toBe(1);
      expect(res.body.metrics.bookings.total).toBe(1);
      expect(res.body.metrics.bookings.confirmed).toBe(1);
      expect(res.body.metrics.financials.totalCollectedRevenue).toBe(1000);
    });

    it('should forbid non-admin users from accessing dashboard telemetry (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Admin Staff Provisioning & User Oversight', () => {
    it('should list registered users without exposing password hashes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(3);

      res.body.users.forEach((u) => {
        expect(u.passwordHash).toBeUndefined();
        expect(u.password).toBeUndefined();
      });
    });

    it('should allow admin to create authorized staff account', async () => {
      const res = await request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Front Desk Specialist',
          email: 'frontdesk@hotelpro.test',
          phone: '+15557778888',
          password: 'StaffPassword2026!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.staff.role).toBe('staff');
      expect(res.body.staff.email).toBe('frontdesk@hotelpro.test');
      expect(res.body.staff.passwordHash).toBeUndefined();
    });
  });

  describe('Staff Check-In & Check-Out Operational Workflows', () => {
    it('should process check-in, set booking to checked_in, and room to occupied', async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/bookings/${testBooking._id}/check-in`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.bookingStatus).toBe('checked_in');

      // Verify room status in DB
      const dbRoom = await Room.findById(testRoom._id);
      expect(dbRoom.status).toBe('occupied');
    });

    it('should process check-out, set booking to checked_out, room to available, and housekeeping to dirty', async () => {
      // First check-in
      await request(app)
        .patch(`/api/v1/staff/bookings/${testBooking._id}/check-in`)
        .set('Authorization', `Bearer ${staffToken}`);

      // Then check-out
      const res = await request(app)
        .patch(`/api/v1/staff/bookings/${testBooking._id}/check-out`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.bookingStatus).toBe('checked_out');

      const dbRoom = await Room.findById(testRoom._id);
      expect(dbRoom.status).toBe('available');
      expect(dbRoom.housekeepingStatus).toBe('dirty');
    });

    it('should update room housekeeping status', async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/rooms/${testRoom._id}/housekeeping`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ housekeepingStatus: 'cleaning_in_progress' });

      expect(res.statusCode).toBe(200);
      expect(res.body.room.housekeepingStatus).toBe('cleaning_in_progress');
    });
  });
});
