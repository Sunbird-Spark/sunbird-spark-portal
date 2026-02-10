import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { CookieNames } from './cookieConstants.js';

// Mock the session store to use MemoryStore for integration tests
vi.mock('./sessionStore.js', () => {
    const session = require('express-session');
    return {
        sessionStore: new session.MemoryStore()
    };
});

const { sessionStore } = await import('./sessionStore.js');

const app = express();

app.use(
    session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
        store: sessionStore,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        }
    })
);

beforeAll(() => {
    app.get('/', (req, res) => {
        req.session.count = (req.session.count || 0) + 1;
        res.json({ count: req.session.count });
    });

    app.get('/readonly', (req, res) => {
        res.json({ ok: true });
    });

    app.get('/set-session', (req, res) => {
        req.session.user = {
            id: 123,
            profile: {
                name: 'test-user',
                roles: ['ANONYMOUS']
            }
        };
        res.json({ success: true });
    });

    app.get('/get-session', (req, res) => {
        res.json({ user: req.session.user });
    });

    app.get('/destroy-session', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ destroyed: true });
        });
    });
});

describe('Session Store Integration Tests', () => {
    describe('Session Creation', () => {
        it('should create a new session and set cookie', async () => {
            const res = await request(app).get('/');

            expect(res.headers['set-cookie']).toBeDefined();
            const cookie = res.headers['set-cookie']![0];

            expect(cookie).toContain(`${CookieNames.SESSION_ID}=`);
        });
    });

    describe('Session Persistence', () => {
        it('should reuse same session across requests', async () => {
            const agent = request.agent(app);

            const res1 = await agent.get('/');
            expect(res1.body.count).toBe(1);

            const res2 = await agent.get('/');
            expect(res2.body.count).toBe(2);
        });

        it('should not reset session on read-only request', async () => {
            const agent = request.agent(app);

            await agent.get('/');
            const res = await agent.get('/readonly');

            expect(res.headers['set-cookie']).toBeUndefined();
        });
    });

    describe('Session Data Storage', () => {
        it('should store and retrieve session data', async () => {
            const agent = request.agent(app);

            await agent.get('/set-session');
            const res = await agent.get('/get-session');

            expect(res.body.user).toEqual({
                id: 123,
                profile: {
                    name: 'test-user',
                    roles: ['ANONYMOUS']
                }
            });
        });

        it('should persist complex objects', async () => {
            const agent = request.agent(app);

            app.get('/set-complex', (req, res) => {
                if (!req.session.user) {
                    req.session.user = { id: 0, profile: { name: '', roles: [] } };
                }
                req.session.user.profile = {
                    roles: ['ANONYMOUS'],
                    name: 'test-user'
                };
                res.json({ ok: true });
            });

            app.get('/get-complex', (req, res) => {
                res.json(req.session.user?.profile || {});
            });

            await agent.get('/set-complex');
            const res = await agent.get('/get-complex');

            expect(res.body).toEqual({
                roles: ['ANONYMOUS'],
                name: 'test-user'
            });
        });
    });

    describe('Session Destruction', () => {
        it('should destroy session and clear cookie', async () => {
            const agent = request.agent(app);

            await agent.get('/');
            const res = await agent.get('/destroy-session');

            expect(res.body.destroyed).toBe(true);
        });
    });

    describe('Cookie Security', () => {
        it('should set HttpOnly cookie', async () => {
            const res = await request(app).get('/');

            expect(res.headers['set-cookie']).toBeDefined();
            const cookie = res.headers['set-cookie']![0];
            expect(cookie).toContain('HttpOnly');
        });

        it('should set SameSite=Lax', async () => {
            const res = await request(app).get('/');

            expect(res.headers['set-cookie']).toBeDefined();
            const cookie = res.headers['set-cookie']![0];
            expect(cookie).toContain('SameSite=Lax');
        });

        it('should not set Secure flag in non-production env', async () => {
            const res = await request(app).get('/');

            expect(res.headers['set-cookie']).toBeDefined();
            const cookie = res.headers['set-cookie']![0];
            expect(cookie).not.toContain('Secure');
        });
    });
});
