import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { pathTraversalGuard } from './pathTraversalGuard.js';

vi.mock('../utils/logger.js', () => ({
    default: {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('../models/Response.js', () => ({
    Response: class {
        public id: string;
        public params: Record<string, unknown> = {};
        public responseCode = 'OK';
        constructor(id: string) {
            this.id = id;
        }
        setError(err: { err: string; errmsg: string; responseCode: string }) {
            this.params.err = err.err;
            this.params.errmsg = err.errmsg;
            this.responseCode = err.responseCode;
        }
    },
}));

describe('pathTraversalGuard', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRequest = {
            method: 'GET',
            ip: '127.0.0.1',
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
        mockNext = vi.fn();
    });

    const run = (originalUrl: string) => {
        mockRequest.originalUrl = originalUrl;
        pathTraversalGuard(mockRequest as Request, mockResponse as Response, mockNext);
    };

    const expectRejected = () => {
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({ err: 'ERR_INVALID_PATH' }),
                responseCode: 'CLIENT_ERROR',
            }),
        );
        expect(mockNext).not.toHaveBeenCalled();
    };

    const expectPassed = () => {
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.send).not.toHaveBeenCalled();
    };

    describe('rejects traversal payloads', () => {
        it('rejects literal /../ in raw path', () => {
            run('/portal/content/v1/read/../../../data/v1/system/settings/list');
            expectRejected();
        });

        it('rejects single percent-encoded %2E%2E', () => {
            run('/portal/content/v1/read/%2E%2E/admin');
            expectRejected();
        });

        it('rejects deeply double-encoded %2525252E%2525252E', () => {
            run('/portal/content/v1/read/%2525252E%2525252E/admin');
            expectRejected();
        });

        it('rejects mixed-case partial encoding .%2e', () => {
            run('/portal/content/v1/read/.%2e/admin');
            expectRejected();
        });

        it('rejects backslash in raw path', () => {
            run('/portal/content/v1/read/foo\\..\\bar');
            expectRejected();
        });

        it('rejects encoded backslash %5C', () => {
            run('/portal/content/v1/read/foo%5C..%5Cbar');
            expectRejected();
        });

        it('rejects null byte %00', () => {
            run('/portal/content/v1/read/foo%00bar');
            expectRejected();
        });

        it('rejects literal /./ in raw path', () => {
            run('/portal/content/v1/read/./admin');
            expectRejected();
        });
    });

    describe('rejects malformed percent-encoding', () => {
        it('rejects bare-% sequence that fails decodeURIComponent', () => {
            run('/portal/content/v1/read/%25%25%25%25%25%25%25');
            expectRejected();
        });

        it('rejects invalid hex escape %ZZ', () => {
            run('/portal/content/v1/read/%ZZ');
            expectRejected();
        });
    });

    describe('decode iteration cap', () => {
        // %2525252541 is 5 nested layers of percent-encoding around 'A':
        // %2525252541 → %25252541 → %252541 → %2541 → %41 → 'A'
        // Exactly MAX_DECODE_ITERATIONS (5) transitions to stabilize.
        it('accepts a payload requiring exactly MAX_DECODE_ITERATIONS transitions', () => {
            run('/portal/content/v1/read/%2525252541');
            expectPassed();
        });

        // %252525252541 is 6 nested layers — one transition more than the cap allows.
        it('rejects a payload requiring more than MAX_DECODE_ITERATIONS transitions', () => {
            run('/portal/content/v1/read/%252525252541');
            expectRejected();
        });
    });

    describe('passes legitimate paths through', () => {
        it('passes nested percent-encoded payload that decodes to a safe segment', () => {
            run('/portal/content/v1/read/%25434fe23');
            expectPassed();
        });

        it('passes path with dots inside a segment', () => {
            run('/portal/content/v1/read/foo.bar.baz');
            expectPassed();
        });

        it('passes a normal API path with query string', () => {
            run('/portal/content/v1/read/do_123?fields=name,description');
            expectPassed();
        });

        it('passes a path with no query string', () => {
            run('/portal/content/v1/read/do_123');
            expectPassed();
        });
    });
});
