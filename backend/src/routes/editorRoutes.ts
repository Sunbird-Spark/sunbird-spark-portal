import express from 'express';
import { kongProxy } from '../proxies/kongProxy.js';
import { oidcSession, requireAuth } from '../auth/oidcMiddleware.js';
import { sessionMiddleware } from '../middlewares/conditionalSession.js';
import reviewCommentRoutes from './reviewCommentRoutes.js';

const router = express.Router();

// Review comment routes - handle directly in portal backend (not proxied to Kong)
// Called by external editor as /action/review/comment/v1/*
router.use('/review/comment/v1', sessionMiddleware, oidcSession(), requireAuth(), reviewCommentRoutes);

const editorRoutes: string[] = [
    '/object/category/definition/*rest',
    '/user/v1/search',
    '/collection/v1/export/*rest',
    '/collection/v1/import/*rest',
    '/data/v1/form/read',
    // '/data/v3/telemetry' — removed: anonymous users POST here too.
    // This is now handled by anonymousActionRoutes (no requireAuth) which
    // serves both anonymous and logged-in SDK batch flushes.
    '/framework/v1/read/*rest',
    '/asset/v1/create',
    '/asset/v1/upload/*rest',
];

router.all(editorRoutes, sessionMiddleware, oidcSession(), requireAuth(), kongProxy);

export default router;