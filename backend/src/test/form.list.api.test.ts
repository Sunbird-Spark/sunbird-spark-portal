import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { FormService } from '../services/formService.js';

const api = request(app);

describe('Form API List Tests', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
