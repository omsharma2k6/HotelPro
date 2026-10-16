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
    email: 'jane.doe@gmail.com',
    phone: '+15551234567',
    password: 'Password123',
    confirmPassword: 'Password123'
  };

  describe('Password Hashing Lifecycle & Verification', () => {
    it('should hash passwords exactly once using bcrypt with salt rounds 10', async () => {
      const plainPassword = 'ExactOncePassword123!';
      const hash = await User.hashPassword(plainPassword);

      // Verify standard bcrypt format ($2a$ or $2b$) and 60-character length
      expect(hash).toMatch(/^\$2[ab]\$10\$.{53}$/);

      // Verify entered password matches stored hash
      const isMatch = await bcrypt.compare(plainPassword, hash);
      expect(isMatch).toBe(true);

      // Verify that the stored hash is NOT a hash of a hash
      // If double-hashed, comparing the raw hash string against the hash would be true
      const isDoubleHashed = await bcrypt.compare(hash, hash);
      expect(isDoubleHashed).toBe(false);

      // Verify wrong plaintext password fails
      const isWrongMatch = await bcrypt.compare('WrongPassword999', hash);
      expect(isWrongMatch).toBe(false);
    });

    it('should ensure Mongoose User model does not double-hash on save or create', async () => {
      const plainPassword = 'SingleHashVerification123!';
      const passwordHash = await User.hashPassword(plainPassword);

      const user = await User.create({
        name: 'Single Hash User',
        email: 'single.hash@gmail.com',
        phone: '+15559998888',
        passwordHash,
        role: 'guest'
      });

      // Fetch user from DB and verify hash was untouched
      const dbUser = await User.findById(user._id).select('+passwordHash');
      expect(dbUser.passwordHash).toBe(passwordHash);

      const isMatch = await dbUser.matchPassword(plainPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe('Admin Seeding Followed by Login', () => {
    it('should allow seeded administrator with dotted Gmail address to log in successfully', async () => {
      const adminEmail = 'om.sharma2k6@gmail.com';
      const adminPassword = 'AdminPassword2026!';

      // Simulate seedAdmin: hash once and create admin user
      const passwordHash = await User.hashPassword(adminPassword);
      await User.create({
        name: 'Om Sharma',
        email: adminEmail.toLowerCase().trim(),
        phone: '+15551112222',
        passwordHash,
        role: 'admin',
        isActive: true
      });

      // Login attempt with the exact registered admin email and password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.token).toBeDefined();
      expect(loginRes.body.user).toBeDefined();
      expect(loginRes.body.user.email).toBe(adminEmail);
      expect(loginRes.body.user.role).toBe('admin');

      // CRITICAL SECURITY ASSERTION: No password hash or secret exposed
      expect(loginRes.body.user.passwordHash).toBeUndefined();
      expect(loginRes.body.user.password).toBeUndefined();
      expect(loginRes.body.passwordHash).toBeUndefined();
      expect(loginRes.body.password).toBeUndefined();
    });

    it('should reject seeded administrator login when password is incorrect', async () => {
      const adminEmail = 'admin.security@gmail.com';
      const adminPassword = 'CorrectPassword123!';

      const passwordHash = await User.hashPassword(adminPassword);
      await User.create({
        name: 'Admin Security',
        email: adminEmail.toLowerCase().trim(),
        phone: '+15553334444',
        passwordHash,
        role: 'admin',
        isActive: true
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: adminEmail,
          password: 'IncorrectPassword999!'
        });

      expect(loginRes.statusCode).toBe(401);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.message).toBe('Invalid email or password');
    });
  });

  describe('Guest Registration Followed by Successful Login', () => {
    it('should successfully register a guest with dotted email and log in immediately', async () => {
      const guestPayload = {
        name: 'Alice Wonder',
        email: 'alice.wonder2026@gmail.com',
        phone: '+15554445555',
        password: 'AlicePassword123!',
        confirmPassword: 'AlicePassword123!'
      };

      // 1. Register
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(guestPayload);

      expect(regRes.statusCode).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.user.email).toBe(guestPayload.email);
      expect(regRes.body.user.role).toBe('guest');

      // 2. Login with newly registered credentials
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: guestPayload.email,
          password: guestPayload.password
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.token).toBeDefined();
      expect(loginRes.body.user.email).toBe(guestPayload.email);
      expect(loginRes.body.user.role).toBe('guest');
      expect(loginRes.body.user.passwordHash).toBeUndefined();
    });
  });

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
      expect(res.body.user.email).toBe('jane.doe@gmail.com');
      expect(res.body.user.role).toBe('guest');

      // CRITICAL SECURITY ASSERTIONS:
      // Response must never contain password or passwordHash
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.password).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();

      // Verify in database that password was hashed
      const dbUser = await User.findOne({ email: 'jane.doe@gmail.com' }).select('+passwordHash');
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
        email: 'jane.doe@gmail.com',
        password: 'Password123'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('jane.doe@gmail.com');
      expect(res.body.user.role).toBe('guest');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane.doe@gmail.com',
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
      await User.updateOne({ email: 'jane.doe@gmail.com' }, { isActive: false });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'jane.doe@gmail.com',
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
      expect(res.body.user.email).toBe('jane.doe@gmail.com');
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
