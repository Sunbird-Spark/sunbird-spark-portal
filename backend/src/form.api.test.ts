import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { FormService } from '../src/services/formService.js';

const api = request(app);

describe('Form API Integration Tests', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Create API', () => {
        const endpoint = '/api/data/v1/form/create';

        it('should create form with valid request', async () => {
            const response = await api
                .post(endpoint)
                .set('Content-Type', 'application/json')
                .send({
                    request: {
                        type: 'content',
                        subType: 'textbook',
                        action: 'save',
                        framework: 'NCF',
                        rootOrgId: 'sunbird',
                        data: { template: 'template1' }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.create');
            expect(response.body.responseCode).toBe('OK');
            expect(response.body.result.created).toBe('OK');
        });

        it('should pass if framework is undefined but rootOrgId is given', async () => {
            // Coverage for lines 43-45 logic: (!framework && !rootOrgId) -> next() -> controller
            // Wait, logic is:
            // if (!framework && !rootOrgId) -> next()
            // else if (framework && !rootOrgId) -> error
            // else -> next()
            // So (!framework && rootOrgId) should pass

            const response = await api
                .post(endpoint)
                .set('Content-Type', 'application/json')
                .send({
                    request: {
                        type: 'content',
                        action: 'save',
                        rootOrgId: 'sunbird',
                        data: { template: 'template1' }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.create');
        });

        it('should pass if neither framework nor rootOrgId is given', async () => {
            const response = await api
                .post(endpoint)
                .set('Content-Type', 'application/json')
                .send({
                    request: {
                        type: 'content',
                        action: 'save',
                        data: { template: 'template1' }
                    }
                });

            expect(response.status).toBe(200);
        });

        it('should fail when framework is given without rootOrgId', async () => {
            const response = await api
                .post(endpoint)
                .set('Content-Type', 'application/json')
                .send({
                    request: {
                        type: 'content',
                        action: 'save',
                        framework: 'NCF',
                        data: { template: 'template1' }
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.params.err).toBe('ERR_CREATE_FORM_DATA');
            expect(response.body.params.errmsg).toContain('rootOrgId');
        });

        it('should fail when required fields are missing', async () => {
            const response = await api
                .post(endpoint)
                .set('Content-Type', 'application/json')
                .send({
                    request: {
                        subType: 'textbook'
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.params.err).toBe('ERR_CREATE_FORM_DATA');
        });

        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'create').mockRejectedValue(new Error('DB Error'));

            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'save',
                        data: { template: 'test' }
                    }
                });

            expect(response.status).toBe(500);
            expect(response.body.params.err).toBe('ERR_CREATE_FORM_DATA');
            expect(response.body.params.errmsg).toBe('DB Error');
        });
    });

    describe('Update API', () => {
        const endpoint = '/api/data/v1/form/update';

        it('should update existing form', async () => {
            // First create a form
            await api
                .post('/api/data/v1/form/create')
                .send({
                    request: {
                        type: 'content',
                        action: 'search',
                        framework: 'testFramework',
                        rootOrgId: 'testOrg',
                        data: { template: 'original' }
                    }
                });

            // Then update it
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'search',
                        framework: 'testFramework',
                        rootOrgId: 'testOrg',
                        data: { template: 'updated' }
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.update');
            expect(response.body.responseCode).toBe('OK');
        });

        it('should fail when framework is given without rootOrgId', async () => {
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'update',
                        framework: 'NCF',
                        data: { template: 'test' }
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.params.errmsg).toContain('rootOrgId');
        });

        it('should fail when updating non-existent form', async () => {
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'nonexistent',
                        action: 'nonexistent',
                        data: { template: 'test' }
                    }
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.body.params.err).toBe('ERR_UPDATE_FORM_DATA');
        });

        it('should fail when data field is missing', async () => {
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'save'
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.params.err).toBe('ERR_UPDATE_FORM_DATA');
        });

        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'update').mockRejectedValue(new Error('Update failed'));

            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'search',
                        data: { template: 'test' }
                    }
                });

            expect(response.status).toBe(500);
            expect(response.body.params.err).toBe('ERR_UPDATE_FORM_DATA');
        });
    });

    describe('Read API', () => {
        const endpoint = '/api/data/v1/form/read';

        it('should read existing form', async () => {
            await api
                .post('/api/data/v1/form/create')
                .send({
                    request: {
                        type: 'content',
                        action: 'view',
                        framework: 'readTest',
                        rootOrgId: 'readOrg',
                        data: { template: 'readTemplate' }
                    }
                });

            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'view',
                        framework: 'readTest',
                        rootOrgId: 'readOrg'
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.read');
            expect(response.body.result.form).toBeDefined();
            expect(response.body.result.form.data).toBeDefined();
        });

        it('should return empty form when not found', async () => {
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'nonexistent',
                        action: 'nonexistent',
                        framework: 'nonexistent',
                        rootOrgId: 'nonexistent'
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.result.form).toEqual({});
        });

        it('should fail when required fields are missing', async () => {
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        framework: 'test'
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.params.err).toBe('ERR_READ_FORM_DATA');
        });

        it('should fail when framework is given without rootOrgId', async () => {
            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'search',
                        framework: 'test'
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.params.errmsg).toContain('rootOrgId');
        });

        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'read').mockRejectedValue(new Error('Read failed'));

            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        type: 'content',
                        action: 'search'
                    }
                });

            expect(response.status).toBe(404); // Controller mapping catches error and sends 404
            expect(response.body.params.err).toBe('ERR_READ_FORM_DATA');
        });
    });

    describe('List API', () => {
        const endpoint = '/api/data/v1/form/list';

        it('should list forms for a valid rootOrgId', async () => {
            // Create a form first
            await api.post('/api/data/v1/form/create').send({
                request: {
                    type: 'list-test',
                    action: 'list-action',
                    rootOrgId: 'listOrg',
                    data: { foo: 'bar' }
                }
            });

            const response = await api
                .post(endpoint)
                .send({
                    request: {
                        rootOrgId: 'listOrg'
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe('api.form.list');
            expect(response.body.result.count).toBeGreaterThan(0);
            expect(Array.isArray(response.body.result.forms)).toBe(true);
        });

        it('should handle service errors gracefully', async () => {
            vi.spyOn(FormService.prototype, 'listAll').mockRejectedValue(new Error('List failed'));

            const response = await api
                .post(endpoint)
                .send({
                    request: { rootOrgId: 'test' }
                });

            expect(response.status).toBe(500);
            expect(response.body.params.err).toBe('ERR_LIST_ALL_FORM');
        });
    });
});
