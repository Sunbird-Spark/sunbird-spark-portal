import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

describe('Express App', () => {
  beforeEach(() => {
    vi.doMock('./utils/sessionStore.js', () => {
      const session = require('express-session');
      return {
        sessionStore: new session.MemoryStore()
      };
    });
  });

  it('should create an Express application', async () => {
    const { app } = await import('./app.js');
    expect(app).toBeDefined();
  });

  it('should handle CORS', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .get('/non-existent-route')
      .set('Origin', 'http://localhost:5173')
      .expect(404);

    // The response should have CORS headers
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should parse JSON', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/test')
      .send({ test: 'data' })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
  });
});