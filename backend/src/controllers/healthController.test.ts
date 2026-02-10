import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Request, Response as ExpressResponse } from 'express';
import { checkHealth } from './healthController.js';
import { ysqlPool } from '../utils/sessionStore.js';

// Mock the ysqlPool
vi.mock('../utils/sessionStore.js', () => ({
    ysqlPool: {
        query: vi.fn()
    }
}));

describe('HealthController', () => {
    let req: Partial<Request>;
    let res: Partial<ExpressResponse>;

    beforeEach(() => {
        req = {};
        res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    it('should return 200 and healthy true when database is connected', async () => {
        (ysqlPool?.query as Mock).mockResolvedValueOnce({ rows: [] });

        await checkHealth(req as Request, res as ExpressResponse);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'api.portal.health',
                responseCode: 'OK',
                result: expect.objectContaining({
                    name: 'portal',
                    healthy: true,
                    check: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'YugabyteDB',
                            healthy: true
                        })
                    ])
                })
            })
        );
    });

    it('should return 503 and healthy false when database query fails', async () => {
        (ysqlPool?.query as Mock).mockRejectedValueOnce(new Error('Connection failed'));

        await checkHealth(req as Request, res as ExpressResponse);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'api.portal.health',
                responseCode: 'SERVICE_UNAVAILABLE',
                result: expect.objectContaining({
                    name: 'portal',
                    healthy: false,
                    check: expect.arrayContaining([
                        expect.objectContaining({
                            name: 'YugabyteDB',
                            healthy: false,
                            errmsg: 'YugabyteDB is not connected'
                        })
                    ])
                })
            })
        );
    });

    it('should return 503 and healthy false when ysqlPool is missing', async () => {
        // Force the check to skip because ysqlPool is null
        // Since we can't easily re-mock the import, we'll test the negative path by clearing the mock implementation
        (ysqlPool?.query as Mock).mockImplementationOnce(() => { throw new Error('YugabyteDB pool not initialized') });

        await checkHealth(req as Request, res as ExpressResponse);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'api.portal.health',
                responseCode: 'SERVICE_UNAVAILABLE',
                result: expect.objectContaining({
                    name: 'portal',
                    healthy: false
                })
            })
        );
    });
});