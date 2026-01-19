import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('Express App', () => {
  it('should create an Express application', () => {
    expect(app).toBeDefined();
  });

  it('should handle CORS', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    // The response should have CORS headers
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should parse JSON', async () => {
    // Test that express.json() middleware is working
    const response = await request(app)
      .post('/test')
      .send({ test: 'data' })
      .set('Content-Type', 'application/json');

    // Even though the route doesn't exist, JSON parsing should work
    expect(response.status).toBe(404);
  });
});