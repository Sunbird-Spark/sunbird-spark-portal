import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import axios from 'axios';

vi.mock('axios');
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('Kong Auth Middleware Integration Tests', () => {
    let app: express.Application;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        app = express();
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: true,
            cookie: { httpOnly: true, sameSite: 'lax', secure: false }
        }));
    });

    afterEach(() => {
        vi.doUnmock('../config/env.js');
    });

    describe('Token Generation and Reuse', () => {
        beforeEach(async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_URL: 'http://mock-kong-api',
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'mock-bearer-token',
                    KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-token',
                    SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
                }
            }));

            const { registerDeviceWithKong } = await import('./kongAuth.js');
            app.use(registerDeviceWithKong());
            app.get('/test', (req, res) => {
                res.json({
                    kongToken: req.session.kongToken,
                    roles: req.session.roles,
                    sessionID: req.sessionID
                });
            });
        });

        it('should generate Kong token on first request and reuse on subsequent requests', async () => {
            (axios.post as Mock).mockResolvedValue({
                data: {
                    params: { status: 'successful' },
                    result: { token: 'integration-token' }
                }
            });

            const agent = request.agent(app);

            // First request - should generate token
            const response1 = await agent.get('/test').expect(200);
            expect(response1.body.kongToken).toBe('integration-token');
            expect(response1.body.roles).toEqual(['ANONYMOUS']);
            expect(axios.post).toHaveBeenCalledWith(
                'http://mock-kong-api/api-manager/v2/consumer/portal_anonymous/credential/register',
                { request: { key: expect.any(String) } },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer mock-bearer-token'
                    }
                }
            );

            const firstCallCount = (axios.post as Mock).mock.calls.length;

            // Second request - should reuse token
            const response2 = await agent.get('/test').expect(200);
            expect(response2.body.kongToken).toBe('integration-token');
            expect(response2.body.sessionID).toBe(response1.body.sessionID);
            expect((axios.post as Mock).mock.calls.length).toBe(firstCallCount);
        });
    });

    describe('Fallback Token Usage', () => {
        beforeEach(async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_URL: 'http://mock-kong-api',
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'mock-bearer-token',
                    KONG_ANONYMOUS_FALLBACK_TOKEN: 'fallback-token',
                    SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
                }
            }));

            const { registerDeviceWithKong } = await import('./kongAuth.js');
            app.use(registerDeviceWithKong());
            app.get('/test', (req, res) => {
                res.json({
                    kongToken: req.session.kongToken,
                    roles: req.session.roles
                });
            });
        });

        it('should use fallback token when Kong API fails or returns invalid response', async () => {
            // Test API failure
            (axios.post as Mock).mockRejectedValue(new Error('Kong API is down'));
            let response = await request(app).get('/test').expect(200);
            expect(response.body.kongToken).toBe('fallback-token');
            expect(response.body.roles).toEqual(['ANONYMOUS']);

            // Test failed status response
            (axios.post as Mock).mockResolvedValue({
                data: { params: { status: 'failed' }, result: {} }
            });
            response = await request(app).get('/test').expect(200);
            expect(response.body.kongToken).toBe('fallback-token');

            // Test missing token in successful response
            (axios.post as Mock).mockResolvedValue({
                data: { params: { status: 'successful' }, result: {} }
            });
            response = await request(app).get('/test').expect(200);
            expect(response.body.kongToken).toBe('fallback-token');
        });
    });

    describe('Configuration Issues', () => {
        it('should handle missing configuration gracefully', async () => {
            vi.resetModules();
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_URL: undefined,
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: undefined,
                    KONG_ANONYMOUS_FALLBACK_TOKEN: 'config-fallback',
                    SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
                }
            }));

            const freshApp = express();
            freshApp.use(session({
                secret: 'test-secret',
                resave: false,
                saveUninitialized: true,
                cookie: { httpOnly: true, sameSite: 'lax', secure: false }
            }));

            const { registerDeviceWithKong } = await import('./kongAuth.js');
            freshApp.use(registerDeviceWithKong());
            freshApp.get('/test', (req, res) => {
                res.json({
                    kongToken: req.session.kongToken,
                    roles: req.session.roles
                });
            });

            const response = await request(freshApp).get('/test').expect(200);
            expect(response.body.kongToken).toBe('config-fallback');
            expect(response.body.roles).toEqual(['ANONYMOUS']);
            expect(axios.post).not.toHaveBeenCalled();
        });

        it('should handle missing fallback token', async () => {
            vi.resetModules();
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_URL: 'http://mock-kong-api',
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: 'mock-bearer-token',
                    KONG_ANONYMOUS_FALLBACK_TOKEN: undefined,
                    SUNBIRD_ANONYMOUS_SESSION_TTL: 60000
                }
            }));

            const freshApp = express();
            freshApp.use(session({
                secret: 'test-secret',
                resave: false,
                saveUninitialized: true,
                cookie: { httpOnly: true, sameSite: 'lax', secure: false }
            }));

            const { registerDeviceWithKong } = await import('./kongAuth.js');
            freshApp.use(registerDeviceWithKong());
            freshApp.get('/test', (req, res) => {
                res.json({
                    kongToken: req.session.kongToken,
                    roles: req.session.roles
                });
            });

            (axios.post as Mock).mockRejectedValue(new Error('Kong API error'));
            const response = await request(freshApp).get('/test').expect(200);
            expect(response.body.kongToken).toBeUndefined();
            expect(response.body.roles).toEqual(['ANONYMOUS']);
        });
    });
});