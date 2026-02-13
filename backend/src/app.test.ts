import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

describe('Express App', () => {
  beforeEach(() => {
    vi.doMock('./config/env.js', () => ({
      envConfig: {
        ENVIRONMENT: 'local',
        SUNBIRD_SESSION_SECRET: 'test',
        SUNBIRD_ANONYMOUS_SESSION_TTL: 1000,
        KONG_URL: 'http://localhost:8000',
        PORTAL_REALM: 'sunbird',
        DOMAIN_URL: 'http://localhost:3000',
        PORTAL_AUTH_SERVER_CLIENT: 'portal',
        LEARN_BASE_URL: 'http://localhost:9000'
      }
    }));
    vi.doMock('./utils/sessionStore.js', () => {
      const session = require('express-session');
      return {
        sessionStore: new session.MemoryStore()
      };
    });
    vi.doMock('./proxies/kongProxy.js', () => ({
      kongProxy: (req: any, res: any) => {
        res.status(200).send('mock-kong-response');
      }
    }));
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
      .expect(302);

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

  it('should handle anonymous portal route', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .get('/portal/content/v1/read/do_123')
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });
});