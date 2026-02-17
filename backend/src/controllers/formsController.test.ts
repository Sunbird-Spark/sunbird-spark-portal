import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { Request, Response } from 'express';
import { create, update, read, listAll } from './formsController.js';
import { FormService } from '../services/formsService.js';
import { logger } from '../utils/logger.js';
import { Response as ApiResponse } from '../models/Response.js';

// Mock FormService
vi.mock('../services/formsService.js', () => {
    const FormServiceMock = vi.fn();
    FormServiceMock.prototype.create = vi.fn();
    FormServiceMock.prototype.update = vi.fn();
    FormServiceMock.prototype.read = vi.fn();
    FormServiceMock.prototype.listAll = vi.fn();
    return { FormService: FormServiceMock };
});

// Mock logger
vi.mock('../utils/logger.js', () => ({
    logger: {
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
    }
}));

describe('FormsController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: Mock;
    let statusMock: Mock;
    let sendMock: Mock;
    let mockFormService: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Setup req/res
        jsonMock = vi.fn();
        sendMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ send: sendMock, json: jsonMock });
        res = {
            status: statusMock,
            send: sendMock,
            json: jsonMock
        };
        req = {
            body: {},
            headers: {}
        };

        // Get the mock instance
        mockFormService = new FormService();
        // Since we mocked the class, obtaining the instance via 'new' in the controller 
        // will return the same prototype methods we spy on here IF the controller creates it once.
        // HOWEVER, `formsController.ts` does: `const formService = new FormService();` at module level.
        // So we need to make sure we are accessing THAT instance's methods.
        // Vitest module mocking handles this by replacing the class. 
        // The instance in controller will be an instance of our mocked class.
        // We can access the methods on the prototype or the instance if we had access to it.
        // Since we don't have direct access to the `formService` constant in the controller,
        // we rely on the fact that `vi.mock` replaces the module export.

        // Because the controller instantiates it at the top level, the mock must be active 
        // BEFORE the controller is imported.
    });

    // Helper to get the mocked service instance specific method
    const getMockMethod = (method: keyof FormService) => {
        // @ts-ignore
        return FormService.prototype[method];
    };

    describe('create', () => {
        it('should create a form successfully', async () => {
            req.body = {
                request: {
                    type: 'form',
                    subType: 'test',
                    action: 'create',
                    rootOrgId: 'org1',
                    framework: 'fw1',
                    data: { field: 'value' },
                    component: 'comp1'
                }
            };

            const createMock = getMockMethod('create');
            createMock.mockResolvedValue({ created: 'OK' });

            await create(req as Request, res as Response);

            expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
                type: 'form',
                subType: 'test',
                action: 'create'
            }));
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                responseCode: 'OK',
                result: { created: 'OK' }
            }));
        });

        it('should handle errors during creation', async () => {
            req.body = { request: {} };
            const createMock = getMockMethod('create');
            const error = new Error('Create failed');
            // @ts-ignore
            error.statusCode = 400;
            createMock.mockRejectedValue(error);

            await create(req as Request, res as Response);

            expect(logger.error).toHaveBeenCalledWith('Error creating form:', error);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                responseCode: 'SERVER_ERROR',
                params: expect.objectContaining({
                    status: 'failed',
                    errmsg: 'Create failed'
                })
            }));
        });

        it('should sanitize input keys', async () => {
            req.body = {
                request: {
                    type: ' FORM ',
                    subType: ' SubType ',
                    action: ' ACTION '
                }
            };

            const createMock = getMockMethod('create');
            createMock.mockResolvedValue({});

            await create(req as Request, res as Response);

            expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
                type: 'form',
                subType: 'subtype', // converted to lower
                action: 'action'    // converted to lower
            }));
        });
    });

    describe('update', () => {
        it('should update a form successfully', async () => {
            req.body = {
                request: {
                    type: 'form',
                    subType: 'test',
                    action: 'update',
                    rootOrgId: 'org1',
                    framework: 'fw1',
                    data: { field: 'newValue' },
                    component: 'comp1'
                }
            };

            const updateMock = getMockMethod('update');
            updateMock.mockResolvedValue({ success: true });

            await update(req as Request, res as Response);

            expect(updateMock).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                responseCode: 'OK',
                result: { response: [{ success: true }] }
            }));
        });

        it('should handle errors during update', async () => {
            req.body = { request: {} };
            const updateMock = getMockMethod('update');
            const error = new Error('Update failed');
            // @ts-ignore
            error.statusCode = 404;
            updateMock.mockRejectedValue(error);

            await update(req as Request, res as Response);

            expect(logger.error).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                responseCode: 'RESOURCE_NOT_FOUND', // 404 maps to RESOURCE_NOT_FOUND
                params: expect.objectContaining({ errmsg: 'Update failed' })
            }));
        });
    });

    describe('read', () => {
        it('should read a form successfully', async () => {
            req.body = {
                request: {
                    type: 'form',
                    subType: 'test',
                    action: 'read',
                    rootOrgId: 'org1',
                    framework: 'fw1',
                    component: 'comp1'
                }
            };

            const readMock = getMockMethod('read');
            // Mocking the behavior of the database result
            // 'read' usually returns an object that might be a Cassandra Row or similar
            // capable of 'get' or acting as an object.
            // based on code:
            // result && typeof (result as any)[Symbol.iterator] === 'function' ? Object.fromEntries(result as any) : { ...result }
            // Let's just return a plain object, it handles that too.
            // Also it handles stringified JSON in 'data' field.

            readMock.mockResolvedValue({
                type: 'form',
                data: JSON.stringify({ field: 'value' }),
                root_org: 'org1'
            });

            await read(req as Request, res as Response);

            expect(readMock).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            // The controller moves root_org to rootOrgId and parses data
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                responseCode: 'OK',
                result: {
                    form: expect.objectContaining({
                        rootOrgId: 'org1',
                        data: { field: 'value' }
                    })
                }
            }));
        });

        it('should return 404 when form not found', async () => {
            req.body = { request: {} };
            const readMock = getMockMethod('read');
            readMock.mockResolvedValue(null);

            await read(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                responseCode: 'RESOURCE_NOT_FOUND',
                params: expect.objectContaining({
                    errmsg: 'Form data not found'
                })
            }));
        });

        it('should handle non-stringified data gracefully', async () => {
            req.body = { request: {} };
            const readMock = getMockMethod('read');
            readMock.mockResolvedValue({
                data: { already: 'object' }
            });

            await read(req as Request, res as Response);

            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                result: {
                    form: expect.objectContaining({
                        data: { already: 'object' }
                    })
                }
            }));
        });
    });

    describe('listAll', () => {
        it('should list forms successfully', async () => {
            req.body = {
                request: {
                    rootOrgId: 'org1'
                }
            };

            const listAllMock = getMockMethod('listAll');
            listAllMock.mockResolvedValue([
                { id: 1, type: 'form' },
                { id: 2, type: 'form' }
            ]);

            await listAll(req as Request, res as Response);

            expect(listAllMock).toHaveBeenCalledWith('org1');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                result: {
                    forms: expect.arrayContaining([{ id: 1, type: 'form' }]),
                    count: 2
                }
            }));
        });

        it('should handle errors in listAll', async () => {
            req.body = { request: {} };
            const listAllMock = getMockMethod('listAll');
            listAllMock.mockRejectedValue(new Error('List failed'));

            await listAll(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
                params: expect.objectContaining({ errmsg: 'List failed' })
            }));
        });
    });
});
