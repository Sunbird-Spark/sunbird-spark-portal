import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../proxies/kongProxy.js', () => ({
  kongProxy: vi.fn((_req: Request, res: Response) => {
    res.status(200).json({ id: 'api.telemetry', responseCode: 'OK' });
  }),
}));

vi.mock('../middlewares/conditionalSession.js', () => ({
  sessionMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
  anonymousMiddlewares: [
    (_req: Request, _res: Response, next: NextFunction) => next(), // registerDeviceWithKong stub
    (_req: Request, _res: Response, next: NextFunction) => next(), // setAnonymousOrg stub
  ],
}));

// In Vitest/ESM, vi.mock is hoisted so these imports already see the mocked versions.
import anonymousActionRoutes from '../routes/anonymousActionRoutes.js';
import { kongProxy } from '../proxies/kongProxy.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Build a minimal Express app scoped to the anonymous action router. */
const buildApp = (sessionMiddlewareOverride?: express.RequestHandler) => {
  const app = express();
  app.use(express.json());

  const sessionSetup = sessionMiddlewareOverride
    ?? ((req: Request, _res: Response, next: NextFunction) => {
        // @ts-ignore
        req.session = { kongToken: 'anon-token', roles: ['ANONYMOUS'] };
        next();
      });

  app.use(sessionSetup);
  app.use('/action', anonymousActionRoutes);
  return app;
};

const withLoggedInSession = (req: Request, _res: Response, next: NextFunction) => {
  // @ts-ignore
  req.session = { userId: 'real-user-456', kongToken: 'auth-kong-token', roles: ['PUBLIC'] };
  next();
};

// ─── Sample payloads ────────────────────────────────────────────────────────

const makeEvent = (uid: string, eid: string, contentId?: string) => ({
  eid,
  ets: Date.now(),
  ver: '3.0',
  mid: `${eid}:${contentId ?? 'home'}`,
  actor: { id: uid, type: 'User' },
  context: {
    channel: 'test-channel',
    pdata: { id: 'sunbird.portal', pid: 'sunbird-portal', ver: '1.0' },
    env: contentId ? 'content' : 'home',
    sid: 'test-session',
    did: 'device-001',
  },
  ...(contentId ? { object: { id: contentId, type: 'Content', ver: '1' } } : {}),
  edata: { type: 'view', pageid: contentId ? 'player' : 'home', uri: '/' },
});

const samplePayload = {
  id: 'api.telemetry',
  ver: '3.0',
  params: { msgid: 'test-msg-id' },
  ets: Date.now(),
  events: [makeEvent('anonymous', 'IMPRESSION')],
};

const buildPlayerPayload = (uid: string, contentId: string) => ({
  id: 'api.telemetry',
  ver: '3.0',
  params: { msgid: 'player-batch-001' },
  ets: Date.now(),
  events: ['START', 'IMPRESSION', 'END'].map(eid => makeEvent(uid, eid, contentId)),
});

// ─── Test Suite ────────────────────────────────────────────────────────────

describe('anonymousActionRoutes', () => {
  const kongProxyMock = kongProxy as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    kongProxyMock.mockImplementation((_req: unknown, res: Response) => {
      res.status(200).json({ id: 'api.telemetry', responseCode: 'OK' });
    });
  });

  // ── Payload validation (new guard) ────────────────────────────────────────

  describe('POST /action/data/v3/telemetry — payload validation', () => {
    it('returns 400 when body is empty (no events array)', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/events array required/);
      expect(kongProxyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when events is not an array', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send({ id: 'api.telemetry', events: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(kongProxyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when body is missing entirely', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .set('Content-Type', 'application/json')
        .send();

      expect(res.status).toBe(400);
      expect(kongProxyMock).not.toHaveBeenCalled();
    });

    it('accepts an empty events array (valid SDK flush)', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send({ ...samplePayload, events: [] });

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── Anonymous (guest) user ───────────────────────────────────────────────

  describe('POST /action/data/v3/telemetry — anonymous user', () => {
    it('proxies the payload to Kong and returns 200', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('does NOT require an Authorization header to succeed', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect(res.status).toBe(200);
    });

    it('forwards a payload where actor.id is "anonymous"', async () => {
      let capturedBody: unknown;
      kongProxyMock.mockImplementation((req: Request, res: Response) => {
        capturedBody = req.body;
        res.status(200).json({ responseCode: 'OK' });
      });

      await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect((capturedBody as any).events[0].actor.id).toBe('anonymous');
    });

    it('returns 200 even when session has no userId (pure unauthenticated)', async () => {
      const app = buildApp((req: Request, _res: Response, next: NextFunction) => {
        // @ts-ignore
        req.session = {}; // no kongToken, no userId
        next();
      });

      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect(res.status).toBe(200);
    });
  });

  // ── Logged-in user ──────────────────────────────────────────────────────

  describe('POST /action/data/v3/telemetry — logged-in user', () => {
    const loggedInPayload = {
      ...samplePayload,
      events: [makeEvent('real-user-456', 'IMPRESSION')],
    };

    it('proxies the payload to Kong and returns 200', async () => {
      const res = await request(buildApp(withLoggedInSession))
        .post('/action/data/v3/telemetry')
        .send(loggedInPayload);

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('correctly passes a user-attributed actor.id through to Kong', async () => {
      let capturedBody: unknown;
      kongProxyMock.mockImplementation((req: Request, res: Response) => {
        capturedBody = req.body;
        res.status(200).json({ responseCode: 'OK' });
      });

      await request(buildApp(withLoggedInSession))
        .post('/action/data/v3/telemetry')
        .send(loggedInPayload);

      expect((capturedBody as any).events[0].actor.id).toBe('real-user-456');
    });

    it('accepts a multi-event batch (START, IMPRESSION, INTERACT, END)', async () => {
      const batchPayload = {
        ...samplePayload,
        events: ['START', 'IMPRESSION', 'INTERACT', 'END'].map(eid =>
          makeEvent('real-user-456', eid),
        ),
      };

      const res = await request(buildApp(withLoggedInSession))
        .post('/action/data/v3/telemetry')
        .send(batchPayload);

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── Player-specific scenarios (it.each — same proxy path, different content IDs) ──

  describe('POST /action/data/v3/telemetry — player telemetry events', () => {
    it.each([
      ['ECML', 'do_ecml_content_001'],
      ['PDF',  'do_pdf_content_001'],
      ['EPUB', 'do_epub_content_001'],
    ])('syncs %s player events for an anonymous user', async (_type, contentId) => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('anonymous', contentId));

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['ECML', 'do_ecml_content_001'],
      ['PDF',  'do_pdf_content_001'],
      ['EPUB', 'do_epub_content_001'],
    ])('syncs %s player events for a logged-in user', async (_type, contentId) => {
      const res = await request(buildApp(withLoggedInSession))
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('real-user-456', contentId));

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── Route exclusivity ────────────────────────────────────────────────────

  describe('Route exclusivity — only POST /data/v3/telemetry is registered', () => {
    it('does NOT handle GET /action/data/v3/telemetry (returns 404)', async () => {
      const res = await request(buildApp()).get('/action/data/v3/telemetry');

      expect(res.status).toBe(404);
      expect(kongProxyMock).not.toHaveBeenCalled();
    });

    it('does NOT handle /action/content/v3/read (returns 404)', async () => {
      const res = await request(buildApp()).get('/action/content/v3/read/do_123');

      expect(res.status).toBe(404);
      expect(kongProxyMock).not.toHaveBeenCalled();
    });
  });

  // ── Kong error propagation ───────────────────────────────────────────────

  describe('Kong error propagation', () => {
    it('relays Kong 5xx error to the caller', async () => {
      kongProxyMock.mockImplementation((_req: unknown, res: Response) => {
        res.status(503).json({ message: 'Kong unavailable' });
      });

      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect(res.status).toBe(503);
    });

    it('relays Kong 4xx error to the caller', async () => {
      kongProxyMock.mockImplementation((_req: unknown, res: Response) => {
        res.status(400).json({ message: 'Bad Request' });
      });

      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect(res.status).toBe(400);
    });
  });
});
