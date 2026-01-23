import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { NextFunction } from 'express';
import { validateCreateAPI, validateReadAPI, validateUpdateAPI, validateListAPI } from './formsValidator.js';


// Mock Response class
vi.mock('../models/Response.js', () => {
    return {
        Response: class {
            constructor() { }
            setError(err: unknown) { this.err = err; }
            err: unknown;
        }
    };
});

describe('Form Validator Middleware', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let req: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
        req = { body: { request: {} } };
        res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn()
        };
        next = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runValidation = (validator: any, requestBody: any) => {
        req.body.request = requestBody;
        validator(req, res, next);
    };

    describe('validateCreateAPI', () => {
        it('should pass with valid data', () => {
            const validData = {
                type: 'content',
                action: 'save',
                data: { some: 'data' },
                rootOrgId: 'org1',
                framework: 'fw1'
            };
            runValidation(validateCreateAPI, validData);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should fail if required fields are missing', () => {
            runValidation(validateCreateAPI, { type: 'content' }); // Missing action, data
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        });

        it('should fail if request body is missing', () => {
            req.body.request = undefined;
            validateCreateAPI(req as any, res as any, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                err: expect.objectContaining({ errmsg: 'Request body is missing' })
            }));
        });

        it('should fail if type is not a string', () => {
            runValidation(validateCreateAPI, { type: 123, action: 'save', data: {} });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                err: expect.objectContaining({ err: 'ERR_CREATE_FORM_DATA' })
            }));
        });

        it('should fail if string is too short (minLength)', () => {
            runValidation(validateCreateAPI, { type: 'ab', action: 'save', data: {} }); // type minLength is 3
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should fail if framework is present without rootOrgId', () => {
            const invalidData = {
                type: 'content',
                action: 'save',
                data: {},
                framework: 'fw1'
                // rootOrgId missing
            };
            runValidation(validateCreateAPI, invalidData);
            expect(res.status).toHaveBeenCalledWith(400);
            const responseArg = res.send.mock.calls[0][0];
            expect(responseArg.err.errmsg).toContain('specify "rootOrgId" along with "framework"');
        });

        it('should handle internal server errors (catch block)', () => {
            const throwingReq = {
                body: {
                    get request() {
                        throw new Error("Internal failure");
                    }
                }
            };
            validateCreateAPI(throwingReq as any, res as any, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
                err: expect.objectContaining({ errmsg: 'Internal failure' })
            }));
        });
    });

    describe('validateReadAPI', () => {
        it('should validate string types strictly', () => {
            req.body.request = { type: 'content', action: 123 }; // action should be string
            validateReadAPI(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateUpdateAPI', () => {
        it('should pass with valid update data', () => {
            const validData = {
                type: 'content',
                action: 'update',
                data: { updated: 'data' },
                rootOrgId: 'org1',
                framework: 'fw1'
            };
            runValidation(validateUpdateAPI, validData);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('validateListAPI', () => {
        it('should fail if rootOrgId is empty string', () => {
            req.body.request = { rootOrgId: '' }; // minLength 1
            validateListAPI(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should fail if rootOrgId is missing', () => {
            req.body.request = {};
            validateListAPI(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
