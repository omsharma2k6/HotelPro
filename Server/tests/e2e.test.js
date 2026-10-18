const request = require('supertest');
const { app } = require('../index');
const { setupTestDB } = require('./setup');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

describe('Module 3: Full End-to-End System & Workflow Validation', () => {
  setupTestDB();

  let adminToken;
  let staffToken;
  let guestToken;
  let guest2Token;
  let guestId;
  let guest2Id;

  const adminEmail = 'superadmin.e2e@hotelpro.internal';
  const staffEmail = 'frontdesk.staff@hotelpro.internal';
  const guestEmail = 'om.sharma.traveler@gmail.com'; // Dotted Gmail test
  const guest2Email = 'jane.guest2@example.com';
  const testPassword = 'Password123!';

  beforeEach(async () => {
    // 1. Seed Admin
    const adminHash = await User.hashPassword(testPassword);
    await User.create({
      name: 'System SuperAdmin',
      email: adminEmail,
      phone: '+15551112222',
      passwordHash: adminHash,
      role: 'admin',
      isActive: true
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLogin.body.token;

    // 2. Provision Staff via Admin endpoint
    const staffRes = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'FrontDesk Concierge',
        email: staffEmail,
        phone: '+15553334444',
        password: testPassword,
        role: 'staff'
      });
    expect(staffRes.status).toBe(201);

    const staffLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: staffEmail, password: testPassword });
    staffToken = staffLogin.body.token;
  });

  test('E2E Lifecycle: Public browsing -> Guest signup & login -> Admin room setup -> Booking -> Payment -> Staff check-in/out -> RBAC barriers', async () => {
    // 1. Unauthenticated visitor checks public rooms (currently 0)
    const initialRoomsRes = await request(app).get('/api/v1/rooms');
    expect(initialRoomsRes.status).toBe(200);
    expect(initialRoomsRes.body.rooms).toHaveLength(0);

    // 2. Guest registers with dotted Gmail & attempts privilege escalation
    const guestReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Om Sharma',
        email: guestEmail,
        phone: '+15557778888',
        password: testPassword,
        confirmPassword: testPassword,
        role: 'admin' // Attempted privilege escalation
      });
    expect(guestReg.status).toBe(201);
    expect(guestReg.body.user.role).toBe('guest'); // Server forced to guest
    guestToken = guestReg.body.token;
    guestId = guestReg.body.user._id;

    // 3. Register second guest for isolation testing
    const guest2Reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Traveler',
        email: guest2Email,
        phone: '+15559990000',
        password: testPassword,
        confirmPassword: testPassword
      });
    expect(guest2Reg.status).toBe(201);
    guest2Token = guest2Reg.body.token;
    guest2Id = guest2Reg.body.user._id;

    // 4. Verify guest login with dotted Gmail address
    const guestLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: guestEmail, password: testPassword });
    expect(guestLogin.status).toBe(200);
    expect(guestLogin.body.user.email).toBe(guestEmail);

    // 5. Admin creates a suite with baseline inventory = 1
    const createRoomRes = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        roomNumber: 'PRESIDENTIAL-901',
        roomType: 'Suite',
        rentPerNight: 500,
        inventory: 1,
        description: 'Ultra-exclusive presidential suite with private helipad view.',
        amenities: ['King Bed', 'Private Jacuzzi', 'High-speed WiFi', 'Butler Service'],
        photos: ['https://example.com/suite901.jpg']
      });
    expect(createRoomRes.status).toBe(201);
    const roomId = createRoomRes.body.room._id;

    // 6. Public visitor checks availability for upcoming dates
    const checkIn = '2027-05-10';
    const checkOut = '2027-05-14'; // 4 nights
    const availRes = await request(app).get(
      `/api/v1/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}`
    );
    expect(availRes.status).toBe(200);
    expect(availRes.body.rooms[0].availableUnits).toBe(1);
    expect(availRes.body.rooms[0].isAvailable).toBe(true);

    // 7. Server rejects invalid booking dates (check-out before check-in)
    const invalidDateRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        roomId,
        checkInDate: '2027-05-15',
        checkOutDate: '2027-05-10'
      });
    expect(invalidDateRes.status).toBe(400);

    // 8. Guest creates an eligible reservation (authoritative backend pricing: 4 nights * $500 = $2000)
    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        specialRequests: 'High floor, complimentary champagne'
      });
    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.booking.numberOfNights).toBe(4);
    expect(bookingRes.body.booking.totalAmount).toBe(2000);
    expect(bookingRes.body.booking.bookingStatus).toBe('pending');
    expect(bookingRes.body.booking.paymentStatus).toBe('unpaid');
    const bookingId = bookingRes.body.booking._id;

    // 9. Payment Workflow: Create payment order & verify signature (Development simulation)
    const orderRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ bookingId });
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.order.amount).toBe(2000);

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        bookingId,
        providerPaymentId: 'sim_pay_test_e2e_123',
        providerOrderId: orderRes.body.order.orderId
      });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.booking.paymentStatus).toBe('paid');

    // 10. Concurrency & Overbooking Prevention: Second guest searches same dates
    const availAfterRes = await request(app).get(
      `/api/v1/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}`
    );
    expect(availAfterRes.body.rooms[0].availableUnits).toBe(0);
    expect(availAfterRes.body.rooms[0].isAvailable).toBe(false);

    // Second guest attempts to book -> Rejected with 409 Conflict
    const overbookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${guest2Token}`)
      .send({
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut
      });
    expect(overbookRes.status).toBe(409);

    // 11. Guest Isolation: Guest 1 sees their booking, Guest 2 sees 0 bookings
    const guest1Bookings = await request(app)
      .get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${guestToken}`);
    expect(guest1Bookings.body.bookings).toHaveLength(1);
    expect(guest1Bookings.body.bookings[0]._id).toBe(bookingId);

    const guest2Bookings = await request(app)
      .get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${guest2Token}`);
    expect(guest2Bookings.body.bookings).toHaveLength(0);

    // Guest 2 cannot view Guest 1's booking by ID
    const unauthorizedView = await request(app)
      .get(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${guest2Token}`);
    expect(unauthorizedView.status).toBe(403);

    // 12. Staff Operations: Front desk check-in
    const checkInRes = await request(app)
      .patch(`/api/v1/staff/bookings/${bookingId}/checkin`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.booking.bookingStatus).toBe('checked_in');
    expect(checkInRes.body.booking.checkInTime).toBeDefined();

    // 13. Staff Operations: Front desk check-out -> room marked dirty
    const checkOutRes = await request(app)
      .patch(`/api/v1/staff/bookings/${bookingId}/checkout`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.booking.bookingStatus).toBe('checked_out');

    const roomAfterCheckout = await Room.findById(roomId);
    expect(roomAfterCheckout.housekeepingStatus).toBe('dirty');

    // 14. Housekeeping update: Staff marks room clean
    const hkRes = await request(app)
      .patch(`/api/v1/staff/rooms/${roomId}/housekeeping`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ housekeepingStatus: 'clean' });
    expect(hkRes.status).toBe(200);
    expect(hkRes.body.room.housekeepingStatus).toBe('clean');

    // 15. Admin Telemetry & Audit: Live aggregation metrics
    const adminDashRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDashRes.status).toBe(200);
    expect(adminDashRes.body.metrics.totalRooms).toBe(1);
    expect(adminDashRes.body.metrics.totalBookings).toBe(1);
    expect(adminDashRes.body.metrics.revenue.collectedRevenue).toBe(2000);

    // 16. Admin Payments Audit Log
    const paymentsRes = await request(app)
      .get('/api/v1/admin/payments')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(paymentsRes.status).toBe(200);
    expect(paymentsRes.body.payments).toHaveLength(1);
    expect(paymentsRes.body.payments[0].amount).toBe(2000);
    expect(paymentsRes.body.payments[0].paymentStatus).toBe('completed');

    // 17. Security Barriers: Guest cannot access admin dashboard
    const guestAdminAttempt = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${guestToken}`);
    expect(guestAdminAttempt.status).toBe(403);

    // 18. Security Barriers: Staff cannot provision accounts
    const staffAdminAttempt = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'Hacker',
        email: 'hacker@hotelpro.internal',
        password: testPassword,
        phone: '+15550001111',
        role: 'admin'
      });
    expect(staffAdminAttempt.status).toBe(403);
  });
});
