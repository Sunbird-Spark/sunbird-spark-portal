import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { FormService } from './formsService.js';

// Mock sessionStore still needed for app.ts/middlewares
vi.mock('../utils/sessionStore.js', () => {
    return {
        ysqlPool: {},
        getYsqlPool: () => ({}),
        sessionStore: {
            get: vi.fn((sid, callback) => callback(null, null)),
            set: vi.fn((sid, session, callback) => callback(null)),
            destroy: vi.fn((sid, callback) => callback(null)),
            on: vi.fn(),
            touch: vi.fn((sid, session, callback) => callback(null))
        }
    };
});

// Mock the new formsDatabase
vi.mock('../databases/formsDatabase.js', () => {
    const mockFormsClient = {
        execute: vi.fn((query: string, params: any[]) => {
            // Helper to create a mock ResultSet
            const createResult = (rows: any[], wasApplied = true) => ({
                rows,
                rowLength: rows.length,
                first: () => {
                    const row = rows[0];
                    if (!row) return null;
                    // Add Row-like methods to the object
                    return {
                        ...row,
                        get: (key: string) => row[key],
                        forEach: (callback: (value: any, key: string) => void) => {
                            Object.keys(row).forEach(key => callback(row[key], key));
                        },
                        keys: () => Object.keys(row),
                        values: () => Object.values(row)
                    };
                },
                wasApplied: () => wasApplied
            });

            if (query.includes('INSERT INTO')) {
                // Determine if we should fail (simulate error if needed, but here we just simulate success)
                return Promise.resolve(createResult([]));
            }

            if (query.includes('SELECT * FROM form_data')) {
                // params: [type, action, subtype, root_org, framework, component]
                const rootOrg = params[3];
                const framework = params[4];

                // Simulate finding a record for specific criteria
                if (rootOrg === 'readOrg' && framework === 'readTest') {
                    return Promise.resolve(createResult([{ root_org: 'readOrg', data: '{}' }]));
                }
                // Match for update test setup verification if needed, or simple read
                if (rootOrg === 'org' && framework === '*') {
                    // Case for 'should handle malformed data in DB' test where we might pass partials
                    // in the test it calls with rootOrgId: 'org'. Implementation will try root_org='org' first.
                    return Promise.resolve(createResult([{ root_org: 'org', data: '{invalidJson}' }]));
                }

                return Promise.resolve(createResult([]));
            }

            if (query.includes('UPDATE form_data')) {
                // params: [data, last_modified, root_org, framework, type, action, subtype, component]
                // root_org is at index 2
                const rootOrg = params[2];
                if (rootOrg === 'nonexistent') {
                    return Promise.resolve(createResult([], false)); // wasApplied = false
                }
                return Promise.resolve(createResult([], true));
            }

            if (query.includes('SELECT type, subtype, action')) { // listAll
                const rootOrg = params[0];
                if (rootOrg === 'listOrg') {
                    return Promise.resolve(createResult([{ type: 'form', data: {} }]));
                }
                return Promise.resolve(createResult([]));
            }

            return Promise.resolve(createResult([]));
        })
    };
    return {
        getFormsClient: () => mockFormsClient
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
            // Setup isn't strictly needed due to mock implementation logic but good for flow
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
            // The service is mocked to return invalidJson for rootOrg='org' in the vi.mock above
            // But we can also spyOn if we want to force it without relying on the global mock logic
            // However, the global mock is already set up to return invalid JSON for this case if we match the criteria.
            // Let's rely on the mock setup in vi.mock to be cleaner or override it. 
            // Since we mocked the DB class specifically, we can't easily override the DB response unless we change the variable it closes over.
            // But spyOn works on the Service method, bypassing DB.
            vi.spyOn(FormService.prototype, 'read').mockResolvedValue({ data: '{invalidJson}', root_org: 'org' } as unknown as any);

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
            // Prepare mock to return result for 'listOrg'
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
