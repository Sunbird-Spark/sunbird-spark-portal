import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// ─── Mocks ─────────────────────────────────────────────────────────────────
// vi.mock calls are hoisted to the top of the file by Vitest, so these
// run before any imports and correctly intercept the modules.

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

// ─── Static imports (after mocks) ──────────────────────────────────────────
// In Vitest/ESM, vi.mock is hoisted so these imports already see the mocked
// versions of transitive dependencies.
import anonymousActionRoutes from '../routes/anonymousActionRoutes.js';
import { kongProxy } from '../proxies/kongProxy.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Build a minimal Express app scoped to the anonymous action router. */
const buildApp = (sessionMiddlewareOverride?: express.RequestHandler) => {
  const app = express();
  app.use(express.json());

  const sessionSetup = sessionMiddlewareOverride
    ?? ((req: Request, _res: Response, next: NextFunction) => {
        // Default: anonymous session (no userId, has kong token)
        // @ts-ignore
        req.session = { kongToken: 'anon-token', roles: ['ANONYMOUS'] };
        next();
      });

  app.use(sessionSetup);
  app.use('/action', anonymousActionRoutes);
  return app;
};

// ─── Sample telemetry payload (Sunbird SDK batch format) ───────────────────

const samplePayload = {
  id: 'api.telemetry',
  ver: '3.0',
  params: { msgid: 'test-msg-id' },
  ets: Date.now(),
  events: [
    {
      eid: 'IMPRESSION',
      ets: Date.now(),
      ver: '3.0',
      mid: 'IMPRESSION:test-msg-id',
      actor: { id: 'anonymous', type: 'User' },
      context: {
        channel: 'test-channel',
        pdata: { id: 'sunbird.portal', pid: 'sunbird-portal', ver: '1.0' },
        env: 'home',
        sid: 'anon-session-001',
        did: 'device-001',
      },
      edata: { type: 'view', pageid: 'home', uri: '/home', subtype: '' },
    },
  ],
};

// ─── Test Suite ────────────────────────────────────────────────────────────

describe('anonymousActionRoutes', () => {
  // Cast using Mock type from vitest — same pattern as telemetryService.test.ts
  const kongProxyMock = kongProxy as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    kongProxyMock.mockImplementation((_req: unknown, res: Response) => {
      res.status(200).json({ id: 'api.telemetry', responseCode: 'OK' });
    });
  });

  // ── Anonymous (guest) user ───────────────────────────────────────────────

  describe('POST /action/data/v3/telemetry — anonymous user', () => {
    it('proxies the payload to Kong and returns 200', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .set('Content-Type', 'application/json')
        .send(samplePayload);

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('does NOT require an Authorization header to succeed', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect(res.status).toBe(200);
    });

    it('forwards a payload where actor.id is "anonymous"', async () => {
      const app = buildApp();
      let capturedBody: unknown;
      kongProxyMock.mockImplementation((req: Request, res: Response) => {
        capturedBody = req.body;
        res.status(200).json({ responseCode: 'OK' });
      });

      await request(app)
        .post('/action/data/v3/telemetry')
        .send(samplePayload);

      expect((capturedBody as any).events[0].actor.id).toBe('anonymous');
    });

    it('accepts an empty events array without error', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send({ ...samplePayload, events: [] });

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
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
    const withLoggedInSession = (req: Request, _res: Response, next: NextFunction) => {
      // @ts-ignore
      req.session = {
        userId: 'real-user-456',
        kongToken: 'auth-kong-token',
        roles: ['PUBLIC'],
        rootOrghashTagId: 'org-hash-tag-001',
      };
      next();
    };

    const loggedInPayload = {
      ...samplePayload,
      events: [{ ...samplePayload.events[0], actor: { id: 'real-user-456', type: 'User' } }],
    };

    it('proxies the payload to Kong and returns 200', async () => {
      const app = buildApp(withLoggedInSession);
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(loggedInPayload);

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('correctly passes a user-attributed actor.id through to Kong', async () => {
      const app = buildApp(withLoggedInSession);
      let capturedBody: unknown;
      kongProxyMock.mockImplementation((req: Request, res: Response) => {
        capturedBody = req.body;
        res.status(200).json({ responseCode: 'OK' });
      });

      await request(app)
        .post('/action/data/v3/telemetry')
        .send(loggedInPayload);

      expect((capturedBody as any).events[0].actor.id).toBe('real-user-456');
    });

    it('accepts a multi-event batch (START, IMPRESSION, INTERACT, END)', async () => {
      const app = buildApp(withLoggedInSession);
      const batchPayload = {
        ...samplePayload,
        events: ['START', 'IMPRESSION', 'INTERACT', 'END'].map(eid => ({
          ...samplePayload.events[0],
          eid,
          actor: { id: 'real-user-456', type: 'User' },
        })),
      };

      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(batchPayload);

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── Player-specific scenarios ──────────────────────────────────────────

  describe('POST /action/data/v3/telemetry — player telemetry events', () => {
    const buildPlayerPayload = (uid: string, contentId: string) => ({
      id: 'api.telemetry',
      ver: '3.0',
      params: { msgid: 'player-batch-001' },
      ets: Date.now(),
      events: ['START', 'IMPRESSION', 'END'].map(eid => ({
        eid,
        ets: Date.now(),
        ver: '3.0',
        mid: `${eid}:${contentId}`,
        actor: { id: uid, type: 'User' },
        context: {
          channel: 'test-channel',
          pdata: { id: 'sunbird.portal', pid: 'sunbird-portal', ver: '1.0' },
          env: 'content',
          sid: 'test-session',
          did: 'device-001',
        },
        object: { id: contentId, type: 'Content', ver: '1' },
        edata: { type: 'content', pageid: 'player', mode: 'play' },
      })),
    });

    it('syncs ECML player events for an anonymous user', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('anonymous', 'do_ecml_content_001'));

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('syncs PDF player events for an anonymous user', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('anonymous', 'do_pdf_content_001'));

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('syncs EPUB player events for an anonymous user', async () => {
      const res = await request(buildApp())
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('anonymous', 'do_epub_content_001'));

      expect(res.status).toBe(200);
      expect(kongProxyMock).toHaveBeenCalledTimes(1);
    });

    it('syncs ECML player events for a logged-in user', async () => {
      const app = buildApp((req: Request, _res: Response, next: NextFunction) => {
        // @ts-ignore
        req.session = { userId: 'real-user-456', kongToken: 'auth-token' };
        next();
      });
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('real-user-456', 'do_ecml_content_001'));

      expect(res.status).toBe(200);
    });

    it('syncs PDF player events for a logged-in user', async () => {
      const app = buildApp((req: Request, _res: Response, next: NextFunction) => {
        // @ts-ignore
        req.session = { userId: 'real-user-456', kongToken: 'auth-token' };
        next();
      });
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('real-user-456', 'do_pdf_content_001'));

      expect(res.status).toBe(200);
    });

    it('syncs EPUB player events for a logged-in user', async () => {
      const app = buildApp((req: Request, _res: Response, next: NextFunction) => {
        // @ts-ignore
        req.session = { userId: 'real-user-456', kongToken: 'auth-token' };
        next();
      });
      const res = await request(app)
        .post('/action/data/v3/telemetry')
        .send(buildPlayerPayload('real-user-456', 'do_epub_content_001'));

      expect(res.status).toBe(200);
    });
  });

  // ── Route exclusivity ────────────────────────────────────────────────────

  describe('Route exclusivity — only POST /data/v3/telemetry is registered', () => {
    it('does NOT handle GET /action/data/v3/telemetry (returns 404)', async () => {
      const app = buildApp();
      const res = await request(app).get('/action/data/v3/telemetry');

      expect(res.status).toBe(404);
      expect(kongProxyMock).not.toHaveBeenCalled();
    });

    it('does NOT handle /action/content/v3/read (returns 404)', async () => {
      const app = buildApp();
      const res = await request(app).get('/action/content/v3/read/do_123');

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
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
