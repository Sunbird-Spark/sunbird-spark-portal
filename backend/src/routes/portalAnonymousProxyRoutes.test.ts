import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';

vi.mock('../proxies/kongProxy.js', () => ({
  kongProxy: vi.fn((_req: Request, res: Response) => {
    res.status(200).json({ responseCode: 'OK' });
  }),
}));

import portalAnonymousProxyRoutes from './portalAnonymousProxyRoutes.js';
import { kongProxy } from '../proxies/kongProxy.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/portal', portalAnonymousProxyRoutes);
  return app;
};

describe('portalAnonymousProxyRoutes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('proxies POST /portal/object/enrichment/v4/list without any session (positive)', async () => {
    const res = await request(buildApp())
      .post('/portal/object/enrichment/v4/list')
      .send({ request: { enrichmentObject: { parentId: 'do_1', enrichmentObjectType: 'Transcript' } } });
    expect(res.status).toBe(200);
    expect(kongProxy).toHaveBeenCalledTimes(1);
  });

  it.each(['create', 'approve/do_1', 'reject/do_1'])(
    'does not expose the write route object/enrichment/v4/%s anonymously (negative)',
    async (path) => {
      const res = await request(buildApp()).post(`/portal/object/enrichment/v4/${path}`).send({});
      expect(res.status).toBe(404);
      expect(kongProxy).not.toHaveBeenCalled();
    },
  );

  it('does not expose the list route over GET (negative)', async () => {
    const res = await request(buildApp()).get('/portal/object/enrichment/v4/list');
    expect(res.status).toBe(404);
    expect(kongProxy).not.toHaveBeenCalled();
  });
});
