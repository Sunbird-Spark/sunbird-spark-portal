import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

const api = request(app);

describe('Form API Integration Tests', () => {

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
    });

    describe('Update API', () => {
        const endpoint = '/api/data/v1/form/update';

        it('should update existing form', async () => {
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
    });
});
