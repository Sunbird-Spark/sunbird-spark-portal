import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import logger from './logger.js';
import { Response, Request, NextFunction } from 'express';

describe('Logger Integration Tests', () => {
    let app: express.Application;
    let logSpy: Mock;
    let errorSpy: Mock;

    beforeEach(() => {
        app = express();
        logSpy = vi.spyOn(logger, 'info');
        errorSpy = vi.spyOn(logger, 'error');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Request Logging', () => {
        it('should log incoming requests with metadata', async () => {
            app.use((req, res, next) => {
                logger.info(`${req.method} ${req.path}`, { query: req.query });
                next();
            });

            app.get('/search', (req, res) => res.json({ results: [] }));

            await request(app).get('/search?q=test').expect(200);

            expect(logSpy).toHaveBeenCalledWith(
                'GET /search',
                { query: { q: 'test' } }
            );
        });

        it('should log POST request body', async () => {
            app.use(express.json());
            app.use((req, res, next) => {
                if (req.method === 'POST') {
                    logger.info(`${req.method} ${req.path}`, { body: req.body });
                }
                next();
            });

            app.post('/api/data', (req, res) => res.json({ received: true }));

            await request(app)
                .post('/api/data')
                .send({ name: 'test' })
                .expect(200);

            expect(logSpy).toHaveBeenCalledWith(
                'POST /api/data',
                { body: { name: 'test' } }
            );
        });
    });

    describe('Error Logging', () => {
        it('should log route errors with context', async () => {
            app.get('/error', (_req, _res, next) => next(new Error('Test error')));

            app.use((err: Error, _req: Request, _res: Response, next: NextFunction) => {
                logger.error('Route error', err);
                _res.status(500).json({ error: err.message });
                next();
            });

            await request(app).get('/error').expect(500);

            expect(errorSpy).toHaveBeenCalledWith(
                'Route error',
                expect.objectContaining({ message: 'Test error' })
            );
        });

        it('should log validation errors', async () => {
            app.use(express.json());
            app.post('/validate', (req, res) => {
                if (!req.body.email) {
                    logger.error('Validation failed: email is required');
                    return res.status(400).json({ error: 'Email required' });
                }
                res.json({ success: true });
            });

            await request(app).post('/validate').send({}).expect(400);

            expect(errorSpy).toHaveBeenCalledWith('Validation failed: email is required');
        });
    });

    describe('Business Logic Logging', () => {
        it('should log successful operations with metadata', async () => {
            app.post('/create', express.json(), (req, res) => {
                logger.info('User created', { userId: 123, username: req.body.username });
                res.json({ id: 123 });
            });

            await request(app).post('/create').send({ username: 'test' }).expect(200);

            expect(logSpy).toHaveBeenCalledWith(
                'User created',
                { userId: 123, username: 'test' }
            );
        });

        it('should log with different levels', async () => {
            const warnSpy = vi.spyOn(logger, 'warn');

            app.get('/levels', (req, res) => {
                logger.info('Info message');
                logger.warn('Warning message');
                res.json({ success: true });
            });

            await request(app).get('/levels').expect(200);

            expect(logSpy).toHaveBeenCalledWith('Info message');
            expect(warnSpy).toHaveBeenCalledWith('Warning message');

            warnSpy.mockRestore();
        });
    });

    describe('Async Operations', () => {
        it('should log async operation lifecycle', async () => {
            app.get('/async', async (req, res) => {
                logger.info('Starting async operation');
                await new Promise(resolve => setTimeout(resolve, 10));
                logger.info('Async operation completed');
                res.json({ success: true });
            });

            await request(app).get('/async').expect(200);

            expect(logSpy).toHaveBeenCalledWith('Starting async operation');
            expect(logSpy).toHaveBeenCalledWith('Async operation completed');
        });

        it('should log async errors', async () => {
            app.get('/async-error', async (req, res, next) => {
                try {
                    await Promise.reject(new Error('Async failed'));
                } catch (error) {
                    logger.error('Async error', error);
                    next(error);
                }
            });

            app.use((err: Error, _req: Request, _res: Response, next: NextFunction) => {
                _res.status(500).json({ error: err.message });
                next();
            });

            await request(app).get('/async-error').expect(500);

            expect(errorSpy).toHaveBeenCalledWith(
                'Async error',
                expect.objectContaining({ message: 'Async failed' })
            );
        });
    });

    describe('Structured Logging', () => {
        it('should log with structured metadata', async () => {
            app.get('/structured', (req, res) => {
                logger.info('User action', {
                    action: 'view_page',
                    userId: 'user123',
                    metadata: { page: '/dashboard' }
                });
                res.json({ success: true });
            });

            await request(app).get('/structured').expect(200);

            expect(logSpy).toHaveBeenCalledWith(
                'User action',
                expect.objectContaining({
                    action: 'view_page',
                    userId: 'user123',
                    metadata: { page: '/dashboard' }
                })
            );
        });

        it('should log performance metrics', async () => {
            app.get('/perf', (req, res) => {
                const start = Date.now();
                const duration = Date.now() - start;

                logger.info('Request completed', {
                    path: req.path,
                    duration: `${duration}ms`
                });

                res.json({ success: true });
            });

            await request(app).get('/perf').expect(200);

            expect(logSpy).toHaveBeenCalledWith(
                'Request completed',
                expect.objectContaining({
                    path: '/perf',
                    duration: expect.stringMatching(/\d+ms/)
                })
            );
        });
    });

    describe('Concurrent Requests', () => {
        it('should log multiple requests independently', async () => {
            app.get('/concurrent/:id', (req, res) => {
                logger.info(`Processing request ${req.params.id}`);
                res.json({ id: req.params.id });
            });

            await Promise.all([
                request(app).get('/concurrent/1'),
                request(app).get('/concurrent/2'),
                request(app).get('/concurrent/3')
            ]);

            expect(logSpy).toHaveBeenCalledWith('Processing request 1');
            expect(logSpy).toHaveBeenCalledWith('Processing request 2');
            expect(logSpy).toHaveBeenCalledWith('Processing request 3');
            expect(logSpy).toHaveBeenCalledTimes(3);
        });
    });
});
