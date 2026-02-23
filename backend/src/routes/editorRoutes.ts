import express from 'express';
import { kongProxy } from '../proxies/kongProxy.js';
import { keycloak } from '../auth/keycloakProvider.js';
import { sessionMiddleware } from '../middlewares/conditionalSession.js';

const router = express.Router();

const editorRoutes: string[] = [
    '/object/category/definition/*rest',
    '/user/v1/search',
    '/collection/v1/export/*rest',
    '/collection/v1/import/*rest',
]

router.all(editorRoutes, sessionMiddleware, keycloak.middleware({ admin: '/home', logout: '/portal/logout' }), keycloak.protect(), kongProxy)

export default router;