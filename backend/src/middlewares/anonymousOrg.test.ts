import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setAnonymousOrg } from './anonymousOrg.js';
import * as organizationController from '../controllers/organizationController.js';
import * as proxyUtils from '../utils/proxyUtils.js';

vi.mock('../controllers/organizationController.js');
vi.mock('../utils/proxyUtils.js');
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('setAnonymousOrg middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockReq = {
            session: {},
        };

        mockRes = {};
        mockNext = vi.fn();

        (proxyUtils.getBearerToken as any).mockReturnValue('test-token');
    });

    it('should skip if channel ID already set', async () => {
        mockReq.session.rootOrghashTagId = 'existing-channel';

        const middleware = setAnonymousOrg();
        await middleware(mockReq, mockRes, mockNext);

        expect(organizationController.fetchAndSetAnonymousOrg).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should fetch and set anonymous org', async () => {
        (organizationController.fetchAndSetAnonymousOrg as any).mockResolvedValue(undefined);

        const middleware = setAnonymousOrg();
        await middleware(mockReq, mockRes, mockNext);

        expect(organizationController.fetchAndSetAnonymousOrg).toHaveBeenCalledWith(
            mockReq,
            'sunbird',
            'test-token'
        );
        expect(mockNext).toHaveBeenCalled();
    });

    it('should continue on error', async () => {
        (organizationController.fetchAndSetAnonymousOrg as any).mockRejectedValue(
            new Error('API Error')
        );

        const middleware = setAnonymousOrg();
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
