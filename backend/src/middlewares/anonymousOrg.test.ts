import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setAnonymousOrg } from './anonymousOrg.js';
import * as organizationService from '../services/organizationService.js';
import * as proxyUtils from '../utils/proxyUtils.js';

vi.mock('../services/organizationService.js');
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

        expect(organizationService.getDefaultOrg).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
    });

    it('should fetch and set anonymous org', async () => {
        const mockOrg = {
            id: 'org-123',
            slug: 'sunbird',
            hashTagId: 'channel-123',
        };

        (organizationService.getDefaultOrg as any).mockResolvedValue(mockOrg);
        (organizationService.setOrgToSession as any).mockImplementation(() => {});
        (organizationService.saveOrgSession as any).mockResolvedValue(undefined);

        const middleware = setAnonymousOrg();
        await middleware(mockReq, mockRes, mockNext);

        expect(organizationService.getDefaultOrg).toHaveBeenCalledWith('sunbird', 'test-token');
        expect(organizationService.setOrgToSession).toHaveBeenCalledWith(mockReq, mockOrg);
        expect(organizationService.saveOrgSession).toHaveBeenCalledWith(mockReq);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should continue on error', async () => {
        (organizationService.getDefaultOrg as any).mockRejectedValue(new Error('API Error'));

        const middleware = setAnonymousOrg();
        await middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
