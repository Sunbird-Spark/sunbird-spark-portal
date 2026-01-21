import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { FormService } from '../services/formService.js';

const api = request(app);

describe('Form API Update Tests', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
