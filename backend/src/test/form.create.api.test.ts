import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { FormService } from '../services/formService.js';

const api = request(app);

describe('Form API Create Tests', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
