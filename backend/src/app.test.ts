import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

describe('Express App', () => {
  beforeEach(() => {
    vi.doMock('./auth/keycloakProvider.js', () => ({
      keycloak: {
        middleware: () => (req: any, res: any, next: any) => next(),
        protect: () => (req: any, res: any, next: any) => next()
      }
    }));
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
    vi.doMock('./proxies/knowlgMwProxy.js', () => ({
      contentActionProxy: (req: any, res: any) => {
        res.status(200).send('mock-knowlg-response');
      }
    }));
    vi.doMock('./middlewares/formsValidator.js', () => ({
      validateCreateAPI: (req: any, res: any, next: any) => next(),
      validateReadAPI: (req: any, res: any, next: any) => next(),
      validateUpdateAPI: (req: any, res: any, next: any) => next(),
      validateListAPI: (req: any, res: any, next: any) => next()
    }));
    vi.doMock('./controllers/formsController.js', () => ({
      create: (req: any, res: any) => res.status(200).send({}),
      read: (req: any, res: any) => {
        res.status(200).send({ result: 'mock-read-response' });
      },
      update: (req: any, res: any) => res.status(200).send({}),
      listAll: (req: any, res: any) => res.status(200).send({})
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

  it('should handle /portal/org/v2/search via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/portal/org/v2/search')
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /portal/data/v1/system/settings/get/* via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .get('/portal/data/v1/system/settings/get/do_123')
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /portal/composite/v1/search via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/portal/composite/v1/search')
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /portal/data/v1/form/read via formsController', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/portal/data/v1/form/read')
      .expect(200);

    expect(response.body).toEqual({ result: 'mock-read-response' });
  });

  it('should handle /action/* routes via knowlgMwProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .get('/action/data/v1/page/assemble')
      .expect(200);

    expect(response.text).toBe('mock-knowlg-response');
  });

  it('should handle /action/object/category/definition/* via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .get('/action/object/category/definition/v1/read')
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /action/user/v1/search via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/user/v1/search')
      .send({ request: {} })
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /action/collection/v1/export via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/collection/v1/export')
      .send({ request: {} })
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /action/collection/v1/import via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/collection/v1/import')
      .send({ request: {} })
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /action/data/v3/telemetry via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/data/v3/telemetry')
      .send({ events: [] })
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle POST requests to /action/* routes', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/content/v1/search')
      .send({ request: { query: 'test' } })
      .expect(200);

    expect(response.text).toBe('mock-knowlg-response');
  });

  it('should handle /action/course/v1/hierarchy/* via knowlgMwProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .get('/action/course/v1/hierarchy/do_123')
      .expect(200);

    expect(response.text).toBe('mock-knowlg-response');
  });

  it('should handle /action/data/v1/telemetry via knowlgMwProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/data/v1/telemetry')
      .send({ events: [] })
      .expect(200);

    expect(response.text).toBe('mock-knowlg-response');
  });
});