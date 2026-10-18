const request = require('supertest');
const { app } = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { generateToken } = require('../utils/jwt');
const { setupTestDB } = require('./setup');

describe('Room Management & Availability API Tests', () => {
  setupTestDB();

  let adminToken;
  let staffToken;
  let guestToken;
  let adminUser;
  let guestUser;

  beforeEach(async () => {
    const passwordHash = await User.hashPassword('Password123');

    adminUser = await User.create({
      name: 'Admin Boss',
      email: 'admin.rooms@hotelpro.test',
      phone: '+15551110000',
      passwordHash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    const staffUser = await User.create({
      name: 'Staff Member',
      email: 'staff.rooms@hotelpro.test',
      phone: '+15551110001',
      passwordHash,
      role: 'staff'
    });
    staffToken = generateToken(staffUser);

    guestUser = await User.create({
      name: 'Guest Traveler',
      email: 'guest.rooms@hotelpro.test',
      phone: '+15551110002',
      passwordHash,
      role: 'guest'
    });
    guestToken = generateToken(guestUser);
  });

  describe('POST /api/v1/rooms (Creation)', () => {
    const validRoomPayload = {
      roomNumber: '101',
      roomType: 'Deluxe',
      description: 'Oceanfront suite with balcony',
      rentPerNight: 250,
      inventory: 2,
      amenities: ['WiFi', 'Air Conditioning', 'Ocean View']
    };

    it('should allow an admin to create a room successfully', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRoomPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.room.roomNumber).toBe('101');
      expect(res.body.room.rentPerNight).toBe(250);
      expect(res.body.room.inventory).toBe(2);
    });

    it('should forbid guest from creating a room (403)', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validRoomPayload);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject room with duplicate roomNumber', async () => {
      await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRoomPayload);

      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRoomPayload);

      expect(res.statusCode).toBe(500); // Caught duplicate or error
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid roomType and negative rent', async () => {
      const invalidPayload = {
        ...validRoomPayload,
        roomNumber: '102',
        roomType: 'InvalidType',
        rentPerNight: -100
      };

      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/rooms & Dynamic Date Availability', () => {
    let testRoom;

    beforeEach(async () => {
      testRoom = await Room.create({
        roomNumber: '201',
        roomType: 'Suite',
        description: 'Presidential Penthouse',
        rentPerNight: 500,
        inventory: 1, // Only 1 physical unit
        amenities: ['Private Pool', 'Butler Service', 'WiFi'],
        status: 'available',
        isActive: true
      });
    });

    it('should list rooms publicly without authentication', async () => {
      const res = await request(app).get('/api/v1/rooms');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.rooms)).toBe(true);
      expect(res.body.rooms.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter rooms by roomType and price range', async () => {
      const res = await request(app)
        .get('/api/v1/rooms')
        .query({ roomType: 'Suite', minPrice: 400, maxPrice: 600 });

      expect(res.statusCode).toBe(200);
      expect(res.body.rooms.length).toBe(1);
      expect(res.body.rooms[0].roomNumber).toBe('201');
    });

    it('should dynamically decrease availability when an overlapping booking exists', async () => {
      // 1. Initially check availability for 2026-11-01 to 2026-11-05 -> Should have 1 unit available
      const check1 = await request(app)
        .get('/api/v1/rooms/availability')
        .query({
          roomId: testRoom._id.toString(),
          checkIn: '2026-11-01',
          checkOut: '2026-11-05'
        });

      expect(check1.statusCode).toBe(200);
      expect(check1.body.isAvailable).toBe(true);
      expect(check1.body.availableUnits).toBe(1);

      // 2. Create an active reservation for 2026-11-02 to 2026-11-04
      await Booking.create({
        user: guestUser._id,
        room: testRoom._id,
        checkInDate: new Date('2026-11-02'),
        checkOutDate: new Date('2026-11-04'),
        numberOfNights: 2,
        guestName: 'Guest Traveler',
        guestContactNumber: '+15551110002',
        pricePerNightSnapshot: 500,
        totalAmount: 1000,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid'
      });

      // 3. Querying the overlapping window (2026-11-01 to 2026-11-05) should now report 0 available units
      const check2 = await request(app)
        .get('/api/v1/rooms/availability')
        .query({
          roomId: testRoom._id.toString(),
          checkIn: '2026-11-01',
          checkOut: '2026-11-05'
        });

      expect(check2.statusCode).toBe(200);
      expect(check2.body.isAvailable).toBe(false);
      expect(check2.body.availableUnits).toBe(0);

      // 4. Querying a non-overlapping window (2026-11-06 to 2026-11-08) should still report 1 unit available
      const check3 = await request(app)
        .get('/api/v1/rooms/availability')
        .query({
          roomId: testRoom._id.toString(),
          checkIn: '2026-11-06',
          checkOut: '2026-11-08'
        });

      expect(check3.statusCode).toBe(200);
      expect(check3.body.isAvailable).toBe(true);
      expect(check3.body.availableUnits).toBe(1);
    });
  });

  describe('DELETE /api/v1/rooms/:id (Safe Archiving)', () => {
    it('should safely soft-archive a room with historical bookings instead of breaking relations', async () => {
      const room = await Room.create({
        roomNumber: '301',
        roomType: 'Single',
        description: 'Single Room',
        rentPerNight: 120,
        inventory: 1
      });

      // Add a historical booking
      await Booking.create({
        user: guestUser._id,
        room: room._id,
        checkInDate: new Date('2026-10-01'),
        checkOutDate: new Date('2026-10-03'),
        numberOfNights: 2,
        guestName: 'Past Guest',
        guestContactNumber: '1234567890',
        pricePerNightSnapshot: 120,
        totalAmount: 240,
        bookingStatus: 'checked_out'
      });

      // Attempt to delete room
      const res = await request(app)
        .delete(`/api/v1/rooms/${room._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.action).toBe('archived');
      expect(res.body.message).toContain('safely archived');

      // Verify in DB that document still exists but is marked inactive
      const dbRoom = await Room.findById(room._id);
      expect(dbRoom).not.toBeNull();
      expect(dbRoom.isActive).toBe(false);
      expect(dbRoom.status).toBe('inactive');
    });

    it('should permanently delete a room if no historical bookings exist', async () => {
      const freshRoom = await Room.create({
        roomNumber: '302',
        roomType: 'Double',
        description: 'Double Room',
        rentPerNight: 180,
        inventory: 1
      });

      const res = await request(app)
        .delete(`/api/v1/rooms/${freshRoom._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.action).toBe('deleted');

      const dbRoom = await Room.findById(freshRoom._id);
      expect(dbRoom).toBeNull();
    });
  });
});
