import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { FormService } from '../services/formService.js';

const api = request(app);

describe('Form API Read Tests', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
