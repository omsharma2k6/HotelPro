const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app } = require('../index');
const User = require('../models/User');
const { setupTestDB } = require('./setup');

describe('Authentication & User Security Tests', () => {
  setupTestDB();

  const validUserPayload = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+15551234567',
    password: 'Password123',
    confirmPassword: 'Password123'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new guest user and return safe user object + token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.body.user.email).toBe('jane.doe@example.com');
      expect(res.body.user.role).toBe('guest');

      // CRITICAL SECURITY ASSERTIONS:
      // Response must never contain password or passwordHash
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.password).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();

      // Verify in database that password was hashed
      const dbUser = await User.findOne({ email: 'jane.doe@example.com' }).select('+passwordHash');
      expect(dbUser).not.toBeNull();
      expect(dbUser.passwordHash).not.toBe(validUserPayload.password);
      expect(dbUser.passwordHash.startsWith('$2')).toBe(true);
      const isMatch = await bcrypt.compare(validUserPayload.password, dbUser.passwordHash);
      expect(isMatch).toBe(true);
    });

    it('should reject registration if email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(validUserPayload);

      const res = await request(app).post('/api/v1/auth/register').send(validUserPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration when password and confirmPassword do not match', async () => {
      const mismatchedPayload = {
        ...validUserPayload,
        email: 'other@example.com',
        confirmPassword: 'DifferentPassword123'
      };

      const res = await request(app).post('/api/v1/auth/register').send(mismatchedPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('Password confirmation does not match');
    });

    it('should reject weak passwords (less than 8 characters or no letters/digits)', async () => {
      const weakPayload = {
        ...validUserPayload,
        email: 'weak@example.com',
        password: 'short',
        confirmPassword: 'short'
      };

      const res = await request(app).post('/api/v1/auth/register').send(weakPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('SECURITY TEST: Public registration must never grant admin or staff roles, even if requested', async () => {
      const maliciousAdminAttempt = {
        ...validUserPayload,
        email: 'hacker@example.com',
        role: 'admin' // Attempting privilege escalation
      };

      const res = await request(app).post('/api/v1/auth/register').send(maliciousAdminAttempt);

      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe('guest');

      const savedUser = await User.findOne({ email: 'hacker@example.com' });
      expect(savedUser.role).toBe('guest');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserPayload);
    });

    it('should successfully log in with valid credentials and return JWT and safe user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane.doe@example.com',
        password: 'Password123'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('jane.doe@example.com');
      expect(res.body.user.role).toBe('guest');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane.doe@example.com',
        password: 'WrongPassword999'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should prevent deactivated users from logging in', async () => {
      await User.updateOne({ email: 'jane.doe@example.com' }, { isActive: false });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane.doe@example.com',
        password: 'Password123'
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/v1/auth/me (Protected Route)', () => {
    let validToken;
    let userId;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(validUserPayload);
      validToken = regRes.body.token;
      userId = regRes.body.user.id;
    });

    it('should return current user profile when given a valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.id).toBe(userId);
      expect(res.body.user.email).toBe('jane.doe@example.com');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject requests with missing Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token required');
    });

    it('should reject malformed or non-Bearer authorization headers', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Basic ${validToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid or tampered JWT token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or malformed token');
    });

    it('should reject expired JWT tokens', async () => {
      // Create expired token with secret
      const expiredToken = jwt.sign(
        { id: userId, role: 'guest' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Token has expired');
    });
  });
});
