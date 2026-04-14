import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { envConfig } from './config/env.js';

vi.mock('./auth/oidcMiddleware.js', () => ({
  oidcSession: () => (_req: any, _res: any, next: any) => next(),
  requireAuth: () => (_req: any, _res: any, next: any) => next()
}));

vi.mock('openid-client', () => ({
  discovery: vi.fn().mockResolvedValue({}),
  clientCredentialsGrant: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
  refreshTokenGrant: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
  authorizationCodeGrant: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
  randomState: vi.fn().mockReturnValue('mock-state'),
  randomNonce: vi.fn().mockReturnValue('mock-nonce'),
  buildAuthorizationUrl: vi.fn().mockReturnValue(new URL('http://example.com/auth')),
  buildEndSessionUrl: vi.fn().mockReturnValue(new URL('http://example.com/logout')),
}));

vi.mock('googleapis', () => ({
  google: { auth: { OAuth2: vi.fn() } }
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn()
}));

vi.mock('./config/env.js', () => ({
  envConfig: {
    ENVIRONMENT: 'local',
    SUNBIRD_SESSION_SECRET: 'test',
    SUNBIRD_ANONYMOUS_SESSION_TTL: 1000,
    KONG_URL: 'http://localhost:8000',
    PORTAL_REALM: 'sunbird',
    DOMAIN_URL: 'http://localhost:3000',
    PORTAL_AUTH_SERVER_CLIENT: 'portal',
    LEARN_BASE_URL: 'http://localhost:9000',
    OIDC_ISSUER_URL: '',
    SUNBIRD_PORTAL_SESSION_STORE: 'memory',
    DEVELOPMENT_REACT_APP_URL: undefined,
  }
}));

vi.mock('./middlewares/conditionalSession.js', () => ({
  sessionMiddleware: (_req: any, _res: any, next: any) => next(),
  anonymousMiddlewares: [(_req: any, _res: any, next: any) => next()]
}));

vi.mock('./proxies/kongProxy.js', () => ({
  kongProxy: (_req: any, res: any) => {
    res.status(200).send('mock-kong-response');
  }
}));

vi.mock('./proxies/knowlgMwProxy.js', () => ({
  contentActionProxy: (_req: any, res: any) => {
    res.status(200).send('mock-knowlg-response');
  }
}));

vi.mock('./middlewares/formsValidator.js', () => ({
  validateCreateAPI: (_req: any, _res: any, next: any) => next(),
  validateReadAPI: (_req: any, _res: any, next: any) => next(),
  validateUpdateAPI: (_req: any, _res: any, next: any) => next(),
  validateListAPI: (_req: any, _res: any, next: any) => next()
}));

vi.mock('./controllers/formsController.js', () => ({
  create: (_req: any, res: any) => res.status(200).send({}),
  read: (_req: any, res: any) => {
    res.status(200).send({ result: 'mock-read-response' });
  },
  update: (_req: any, res: any) => res.status(200).send({}),
  listAll: (_req: any, res: any) => res.status(200).send({})
}));

describe('Express App', () => {
  it('should create an Express application', async () => {
    const { app } = await import('./app.js');
    expect(app).toBeDefined();
  }, 30000);

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

  it('should handle /action/collection/v1/export/:id via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/collection/v1/export/do_123')
      .send({ request: {} })
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /action/collection/v1/import/:id via kongProxy', async () => {
    const { app } = await import('./app.js');
    const response = await request(app)
      .post('/action/collection/v1/import/do_123')
      .send({ request: {} })
      .expect(200);

    expect(response.text).toBe('mock-kong-response');
  });

  it('should handle /action/data/v3/telemetry via kong proxy', async () => {
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

describe('GET /dial/:id — dial code redirect', () => {
  afterEach(() => {
    (envConfig as any).DEVELOPMENT_REACT_APP_URL = undefined;
  });

  it('redirects to /explore?dialcodes=<id> when DEVELOPMENT_REACT_APP_URL is not set', async () => {
    const { app } = await import('./app.js');
    const res = await request(app).get('/dial/H3A2E6');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/explore?dialcodes=H3A2E6');
  });

  it('works for any alphanumeric dial code', async () => {
    const { app } = await import('./app.js');
    const res = await request(app).get('/dial/ABC123');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/explore?dialcodes=ABC123');
  });

  it('URL-encodes special characters in the dial code', async () => {
    // Express decodes %20 → space in req.params, then encodeURIComponent re-encodes it → %20
    const { app } = await import('./app.js');
    const res = await request(app).get('/dial/H3%20A2E6');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/explore?dialcodes=H3%20A2E6');
  });

  it('prefixes the redirect with DEVELOPMENT_REACT_APP_URL when set', async () => {
    (envConfig as any).DEVELOPMENT_REACT_APP_URL = 'http://localhost:5173';
    const { app } = await import('./app.js');
    const res = await request(app).get('/dial/H3A2E6');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/explore?dialcodes=H3A2E6');
  });

  it('returns 400 when no dial code is provided (GET /dial)', async () => {
    const { app } = await import('./app.js');
    const res = await request(app).get('/dial');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing dial code');
  });

  it('does not handle POST /dial/:id (returns 404)', async () => {
    const { app } = await import('./app.js');
    const res = await request(app).post('/dial/H3A2E6');
    expect(res.status).toBe(404);
  });
});
