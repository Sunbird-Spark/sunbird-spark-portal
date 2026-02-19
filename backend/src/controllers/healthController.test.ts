import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response as ExpressResponse } from 'express';

// Hoist shared mocks
const { mockQuery, mockPoolInstance, mockOn } = vi.hoisted(() => {
    const mockQuery = vi.fn();
    const mockOn = vi.fn();
    const mockPoolInstance = {
        query: mockQuery,
        on: mockOn
    };
    return { mockQuery, mockPoolInstance, mockOn };
});

// Mock the module
vi.mock('@yugabytedb/pg', () => {
    // Use a regular function so it can be used as a constructor
    const PoolMock = vi.fn(function() { return mockPoolInstance; });
    return {
        Pool: PoolMock,
        default: { Pool: PoolMock }
    };
});

import { checkHealth } from './healthController.js';

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
        mockQuery.mockReset();
        mockOn.mockReset();
    });

    it('should return 200 and healthy true when database is connected', async () => {
        mockQuery.mockResolvedValueOnce({ rows: [] });

        await checkHealth(req as Request, res as ExpressResponse);

        // Verify query was called
        expect(mockQuery).toHaveBeenCalledWith('SELECT 1');

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
        mockQuery.mockRejectedValueOnce(new Error('Connection failed'));

        await checkHealth(req as Request, res as ExpressResponse);

        expect(mockQuery).toHaveBeenCalledWith('SELECT 1');

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
});
