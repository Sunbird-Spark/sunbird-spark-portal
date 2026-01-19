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
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
                secure: false
            }
        }));
    });

    afterEach(() => {
        vi.doUnmock('../config/env.js');
    });

    describe('Successful Token Generation', () => {
        beforeEach(async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_ANONYMOUS_DEVICE_REGISTER_API: 'http://mock-kong-api',
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

        it('should generate Kong token on first request', async () => {
            (axios.post as Mock).mockResolvedValue({
                data: {
                    params: { status: 'successful' },
                    result: { token: 'new-integration-token' }
                }
            });

            const response = await request(app)
                .get('/test')
                .expect(200);

            expect(response.body.kongToken).toBe('new-integration-token');
            expect(response.body.roles).toEqual(['ANONYMOUS']);
            expect(response.headers['set-cookie']).toBeDefined();
            
            expect(axios.post).toHaveBeenCalledWith(
                'http://mock-kong-api',
                { request: { key: expect.any(String) } },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer mock-bearer-token'
                    }
                }
            );
        });

        it('should reuse existing Kong token on subsequent requests', async () => {
            (axios.post as Mock).mockResolvedValue({
                data: {
                    params: { status: 'successful' },
                    result: { token: 'reuse-token' }
                }
            });

            const agent = request.agent(app);

            const response1 = await agent.get('/test').expect(200);
            expect(response1.body.kongToken).toBe('reuse-token');
            
            const firstCallCount = (axios.post as Mock).mock.calls.length;

            const response2 = await agent.get('/test').expect(200);
            expect(response2.body.kongToken).toBe('reuse-token');
            
            expect((axios.post as Mock).mock.calls.length).toBe(firstCallCount);
        });

        it('should refresh session TTL on token reuse', async () => {
            (axios.post as Mock).mockResolvedValue({
                data: {
                    params: { status: 'successful' },
                    result: { token: 'ttl-test-token' }
                }
            });

            const agent = request.agent(app);

            const response1 = await agent.get('/test').expect(200);
            expect(response1.body.kongToken).toBe('ttl-test-token');

            const response2 = await agent.get('/test').expect(200);
            expect(response2.body.kongToken).toBe('ttl-test-token');
            
            expect(response1.body.sessionID).toBe(response2.body.sessionID);
        });
    });

    describe('Kong API Failure Scenarios', () => {
        beforeEach(async () => {
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_ANONYMOUS_DEVICE_REGISTER_API: 'http://mock-kong-api',
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

        it('should use fallback token when Kong API fails', async () => {
            (axios.post as Mock).mockRejectedValue(new Error('Kong API is down'));

            const response = await request(app)
                .get('/test')
                .expect(200);

            expect(response.body.kongToken).toBe('fallback-token');
            expect(response.body.roles).toEqual(['ANONYMOUS']);
        });

        it('should use fallback token when Kong API returns failed status', async () => {
            (axios.post as Mock).mockResolvedValue({
                data: {
                    params: { status: 'failed' },
                    result: {}
                }
            });

            const response = await request(app)
                .get('/test')
                .expect(200);

            expect(response.body.kongToken).toBe('fallback-token');
            expect(response.body.roles).toEqual(['ANONYMOUS']);
        });

        it('should use fallback token when Kong API returns no token', async () => {
            (axios.post as Mock).mockResolvedValue({
                data: {
                    params: { status: 'successful' },
                    result: {}
                }
            });

            const response = await request(app)
                .get('/test')
                .expect(200);

            expect(response.body.kongToken).toBe('fallback-token');
            expect(response.body.roles).toEqual(['ANONYMOUS']);
        });
    });

    describe('Configuration Issues', () => {
        it('should use fallback token when Kong API config is missing', async () => {
            vi.resetModules();
            
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_ANONYMOUS_DEVICE_REGISTER_API: undefined,
                    KONG_ANONYMOUS_DEVICE_REGISTER_TOKEN: undefined,
                    KONG_ANONYMOUS_FALLBACK_TOKEN: 'config-missing-fallback',
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

            const response = await request(freshApp)
                .get('/test')
                .expect(200);

            expect(response.body.kongToken).toBe('config-missing-fallback');
            expect(response.body.roles).toEqual(['ANONYMOUS']);
            expect(axios.post).not.toHaveBeenCalled();
        });

        it('should handle missing fallback token', async () => {
            vi.resetModules();
            
            vi.doMock('../config/env.js', () => ({
                envConfig: {
                    KONG_ANONYMOUS_DEVICE_REGISTER_API: 'http://mock-kong-api',
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

            const response = await request(freshApp)
                .get('/test')
                .expect(200);

            expect(response.body.kongToken).toBeUndefined();
            expect(response.body.roles).toEqual(['ANONYMOUS']);
        });
    });
});