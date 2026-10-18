const request = require('supertest');
const { app } = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { generateToken } = require('../utils/jwt');
const { setupTestDB } = require('./setup');

describe('Secure Payment Architecture Tests', () => {
  setupTestDB();

  let guestUser;
  let guestToken;
  let testRoom;
  let testBooking;

  beforeEach(async () => {
    const passwordHash = await User.hashPassword('Password123');

    guestUser = await User.create({
      name: 'Paying Guest',
      email: 'paying.guest@hotelpro.test',
      phone: '+15559871111',
      passwordHash,
      role: 'guest'
    });
    guestToken = generateToken(guestUser);

    testRoom = await Room.create({
      roomNumber: '501',
      roomType: 'Suite',
      description: 'Luxury Suite',
      rentPerNight: 300,
      inventory: 2,
      status: 'available'
    });

    testBooking = await Booking.create({
      user: guestUser._id,
      room: testRoom._id,
      checkInDate: new Date('2026-11-10'),
      checkOutDate: new Date('2026-11-12'),
      numberOfNights: 2,
      guestName: 'Paying Guest',
      guestContactNumber: '+15559871111',
      pricePerNightSnapshot: 300,
      totalAmount: 600,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid'
    });
  });

  describe('GET /api/v1/payments/config', () => {
    it('should return public payment configuration identifying mock development mode when Razorpay keys are omitted', async () => {
      const res = await request(app).get('/api/v1/payments/config');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.config.isMockMode).toBe(true);
      expect(res.body.config.activeProvider).toBe('mock');
    });
  });

  describe('POST /api/v1/payments/create-order', () => {
    it('should create a simulated order in development mock mode for the booking', async () => {
      const res = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ bookingId: testBooking._id.toString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.provider).toBe('mock');
      expect(res.body.order.orderId.startsWith('MOCK_ORD_')).toBe(true);
      expect(res.body.order.amount).toBe(600);
      expect(res.body.order.isSimulated).toBe(true);

      // Verify pending payment document in MongoDB
      const dbPayment = await Payment.findOne({ providerOrderId: res.body.order.orderId });
      expect(dbPayment).not.toBeNull();
      expect(dbPayment.paymentStatus).toBe('pending');
    });
  });

  describe('POST /api/v1/payments/verify', () => {
    let orderId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ bookingId: testBooking._id.toString() });

      orderId = orderRes.body.order.orderId;
    });

    it('should verify mock payment, update Payment to completed, and Booking to confirmed & paid', async () => {
      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: testBooking._id.toString(),
          providerOrderId: orderId,
          mockSuccess: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.paymentStatus).toBe('paid');
      expect(res.body.booking.bookingStatus).toBe('confirmed');

      // Verify in MongoDB
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.paymentStatus).toBe('paid');
      expect(updatedBooking.bookingStatus).toBe('confirmed');

      const updatedPayment = await Payment.findOne({ providerOrderId: orderId });
      expect(updatedPayment.paymentStatus).toBe('completed');
    });

    it('IDEMPOTENCY TEST: Calling verify twice must succeed without duplicating payments or causing errors', async () => {
      // First verification
      await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: testBooking._id.toString(),
          providerOrderId: orderId,
          mockSuccess: true
        });

      // Second identical verification
      const secondRes = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: testBooking._id.toString(),
          providerOrderId: orderId,
          mockSuccess: true
        });

      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.isIdempotent).toBe(true);

      // Verify only 1 completed payment exists for this order
      const paymentCount = await Payment.countDocuments({ providerOrderId: orderId });
      expect(paymentCount).toBe(1);
    });

    it('should reject payment verification if mock simulation indicates failure', async () => {
      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: testBooking._id.toString(),
          providerOrderId: orderId,
          mockSuccess: false
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);

      const dbPayment = await Payment.findOne({ providerOrderId: orderId });
      expect(dbPayment.paymentStatus).toBe('failed');
    });
  });
});
