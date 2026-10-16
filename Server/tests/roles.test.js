const express = require('express');
const request = require('supertest');
const { protect } = require('../middleware/authMiddleware');
const { authorize, isAdmin, isStaff } = require('../middleware/roleMiddleware');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const { setupTestDB } = require('./setup');

describe('Role-Based Authorization Middleware Tests', () => {
  setupTestDB();

  let app;
  let guestToken;
  let staffToken;
  let adminToken;

  beforeEach(async () => {
    // Setup test express router
    app = express();
    app.use(express.json());

    // Test routes for role authorization
    app.get('/test/guest-only', protect, authorize('guest'), (req, res) => {
      res.json({ success: true, message: 'Welcome guest' });
    });

    app.get('/test/staff-zone', protect, isStaff, (req, res) => {
      res.json({ success: true, message: 'Welcome staff or admin' });
    });

    app.get('/test/admin-zone', protect, isAdmin, (req, res) => {
      res.json({ success: true, message: 'Welcome administrator' });
    });

    // Create users for each role
    const hash = await User.hashPassword('Password123');

    const guestUser = await User.create({
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '1234567890',
      passwordHash: hash,
      role: 'guest'
    });
    guestToken = generateToken(guestUser);

    const staffUser = await User.create({
      name: 'Staff User',
      email: 'staff@example.com',
      phone: '1234567891',
      passwordHash: hash,
      role: 'staff'
    });
    staffToken = generateToken(staffUser);

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567892',
      passwordHash: hash,
      role: 'admin'
    });
    adminToken = generateToken(adminUser);
  });

  describe('Admin Authorization', () => {
    it('should permit admin user to access admin-zone', async () => {
      const res = await request(app)
        .get('/test/admin-zone')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid guest user from accessing admin-zone with 403', async () => {
      const res = await request(app)
        .get('/test/admin-zone')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('should forbid staff user from accessing admin-zone with 403', async () => {
      const res = await request(app)
        .get('/test/admin-zone')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('Staff Authorization', () => {
    it('should permit staff user to access staff-zone', async () => {
      const res = await request(app)
        .get('/test/staff-zone')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should permit admin user to access staff-zone (hierarchical staff privileges)', async () => {
      const res = await request(app)
        .get('/test/staff-zone')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid guest user from accessing staff-zone with 403', async () => {
      const res = await request(app)
        .get('/test/staff-zone')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
