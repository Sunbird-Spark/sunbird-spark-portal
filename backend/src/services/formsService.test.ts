import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { FormService } from './formsService.js';

vi.mock('../utils/sessionStore.js', () => {
    const mockYsqlPool = {
        query: (...args: any[]) => {
            const [query, params] = args;
            if (query.includes('INSERT INTO')) {
                return Promise.resolve({ rowCount: 1, rows: [] });
            }
            if (query.includes('SELECT * FROM form_data')) {
                if (params && params[0] === 'readOrg') {
                    return Promise.resolve({ rows: [{ root_org: 'readOrg', data: '{}' }] });
                }
                return Promise.resolve({ rows: [] });
            }
            if (query.includes('UPDATE form_data')) {
                if (params && params[4] === 'nonexistent') {
                    return Promise.resolve({ rowCount: 0, rows: [] });
                }
                return Promise.resolve({ rowCount: 1, rows: [] });
            }
            if (query.includes('SELECT type, subtype, action')) {
                return Promise.resolve({ rows: [{ type: 'form', data: {} }] });
            }
            return Promise.resolve({ rows: [] });
        }
    };
    return {
        ysqlPool: mockYsqlPool,
        getYsqlPool: () => mockYsqlPool,
        sessionStore: {
            get: vi.fn((sid, callback) => callback(null, null)),
            set: vi.fn((sid, session, callback) => callback(null)),
            destroy: vi.fn((sid, callback) => callback(null)),
            on: vi.fn(),
            touch: vi.fn((sid, session, callback) => callback(null))
        }
    };
});

const api = request(app);

describe('FormService API Integration', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Create', () => {
        const endpoint = '/data/v1/form/create';
        it.each([
            [{ type: 'content', subType: 'textbook', action: 'save', framework: 'NCF', rootOrgId: 'sunbird', data: { template: 'template1' } }],
            [{ type: 'content', action: 'save', rootOrgId: 'sunbird', data: { template: 'template1' } }],
            [{ type: 'content', action: 'save', data: { template: 'template1' } }]
        ])('should create form with valid/partial request %#', async (reqBody) => {
            const response = await api.post(endpoint).set('Content-Type', 'application/json').send({ request: reqBody });
            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.create');
        });
        it('should handle DB error gracefully', async () => {
            vi.spyOn(FormService.prototype, 'create').mockRejectedValue(new Error('DB Error'));
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'save', data: {} } });
            expect(response.status).toBe(500);
            expect(response.body.params.err).toBe('ERR_CREATE_FORM_DATA');
        });
        it('should handle 404 error from service', async () => {
            const error: any = new Error('Not found');
            error.statusCode = 404;
            vi.spyOn(FormService.prototype, 'create').mockRejectedValue(error);
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'save', data: {} } });
            expect(response.status).toBe(404);
            expect(response.body.responseCode).toBe('RESOURCE_NOT_FOUND');
        });
    });

    describe('Read', () => {
        const endpoint = '/data/v1/form/read';
        it('should read existing form', async () => {
            await api.post('/data/v1/form/create').send({ request: { type: 'content', action: 'view', framework: 'readTest', rootOrgId: 'readOrg', data: { template: 'readTemplate' } } });
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'view', framework: 'readTest', rootOrgId: 'readOrg' } });
            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.read');
            expect(response.body.result.form).toBeDefined();
        });
        it('should return 404 when form not found', async () => {
            const response = await api.post(endpoint).send({ request: { type: 'nonexistent', action: 'nonexistent', framework: 'nonexistent', rootOrgId: 'nonexistent' } });
            expect(response.status).toBe(404);
            expect(response.body.params.err).toBe('ERR_READ_FORM_DATA');
        });
        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'read').mockRejectedValue(new Error('Read failed'));
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'view' } });
            expect(response.status).toBe(500);
            expect(response.body.params.err).toBe('ERR_READ_FORM_DATA');
        });
        it('should handle malformed data in DB', async () => {
            vi.spyOn(FormService.prototype, 'read').mockResolvedValue({ data: '{invalidJson}', root_org: 'org' });
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'view', rootOrgId: 'org' } });
            expect(response.status).toBe(200);
            expect(response.body.result.form).toBeDefined();
        });
    });

    describe('Update', () => {
        const endpoint = '/data/v1/form/update';
        it('should update existing form', async () => {
            await api.post('/data/v1/form/create').send({ request: { type: 'content', action: 'search', framework: 'testFramework', rootOrgId: 'testOrg', data: { template: 'original' } } });
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'search', framework: 'testFramework', rootOrgId: 'testOrg', data: { template: 'updated' } } });
            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.update');
        });
        it.each([
            [{ type: 'content', action: 'update', framework: 'NCF', data: { template: 'test' } }, 400],
            [{ type: 'nonexistent', action: 'update', framework: 'NCF', rootOrgId: 'nonexistent', data: { template: 'test' } }, [404, 400]]
        ])('should handle invalid or not found update %#', async (reqBody, expected) => {
            const response = await api.post(endpoint).send({ request: reqBody });
            if (Array.isArray(expected)) expect(expected).toContain(response.status);
            else expect(response.status).toBe(expected);
        });
        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'update').mockRejectedValue(new Error('Update failed'));
            const response = await api.post(endpoint).send({ request: { type: 'content', action: 'update' } });
            expect([400, 500]).toContain(response.status);
            expect(response.body.params.err).toBe('ERR_UPDATE_FORM_DATA');
        });
    });

    describe('List', () => {
        const endpoint = '/data/v1/form/list';
        it('should list forms for a valid rootOrgId', async () => {
            await api.post('/data/v1/form/create').send({ request: { type: 'list-test', action: 'list-action', rootOrgId: 'listOrg', data: { foo: 'bar' } } });
            const response = await api.post(endpoint).send({ request: { rootOrgId: 'listOrg' } });
            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.list');
            expect(response.body.result.count).toBeGreaterThan(0);
            expect(Array.isArray(response.body.result.forms)).toBe(true);
        });
        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'listAll').mockRejectedValue(new Error('List failed'));
            const response = await api.post(endpoint).send({ request: { rootOrgId: 'test' } });
            expect(response.status).toBe(500);
            expect(response.body.params.err).toBe('ERR_LIST_ALL_FORM');
        });
        it('should handle 404 error from service', async () => {
            const error: any = new Error('Not found');
            error.statusCode = 404;
            vi.spyOn(FormService.prototype, 'listAll').mockRejectedValue(error);
            const response = await api.post(endpoint).send({ request: { rootOrgId: 'test' } });
            expect(response.status).toBe(404);
            expect(response.body.responseCode).toBe('RESOURCE_NOT_FOUND');
        });
        it.each([
            [{}],
            [{ rootOrgId: '' }]
        ])('should handle missing/empty rootOrgId %#', async (reqBody) => {
            const response = await api.post(endpoint).send({ request: reqBody });
            expect(response.status).toBe(400);
        });
    });

    describe('Unit Tests: listAll Validation', () => {
        it('should throw 400 if rootOrgId is missing/empty', async () => {
            const service = new FormService();
            // Test undefined
            await expect(service.listAll(undefined as any)).rejects.toMatchObject({ statusCode: 400, message: 'rootOrgId must be a non-empty string' });
            // Test empty string
            await expect(service.listAll('')).rejects.toMatchObject({ statusCode: 400 });
            // Test whitespace
            await expect(service.listAll('   ')).rejects.toMatchObject({ statusCode: 400 });
        });
    });
});
