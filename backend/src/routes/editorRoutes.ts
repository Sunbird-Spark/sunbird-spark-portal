import express from 'express';
import { kongProxy } from '../proxies/kongProxy.js';
import { keycloak } from '../auth/keycloakProvider.js';
import { sessionMiddleware } from '../middlewares/conditionalSession.js';
import reviewCommentRoutes from './reviewCommentRoutes.js';

const router = express.Router();

// Review comment routes - handle directly in portal backend (not proxied to Kong)
// Called by external editor as /action/review/comment/v1/*
router.use('/review/comment/v1', sessionMiddleware, keycloak.middleware({ admin: '/home', logout: '/portal/logout' }), keycloak.protect(), reviewCommentRoutes);

const editorRoutes: string[] = [
    '/object/category/definition/*rest',
    '/user/v1/search',
    '/collection/v1/export/*rest',
    '/collection/v1/import/*rest',
    '/data/v1/form/read',
    '/data/v3/telemetry',
    '/framework/v1/read/*rest',
];

router.all(editorRoutes, sessionMiddleware, keycloak.middleware({ admin: '/home', logout: '/portal/logout' }), keycloak.protect(), kongProxy);

export default router;