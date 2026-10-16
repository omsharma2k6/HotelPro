const request = require('supertest');
const { app } = require('../index');
const { setupTestDB } = require('./setup');

describe('API Health and Routing Tests', () => {
  setupTestDB();

  it('GET /api/health should return 200 with structured status and database state', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('HotelPro API is running');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 404 for undefined routes with structured JSON', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Resource not found');
  });
});
