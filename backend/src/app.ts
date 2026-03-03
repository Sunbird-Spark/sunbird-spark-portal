import express from 'express';
import cors from 'cors';
import { oidcSession, requireAuth } from './auth/oidcMiddleware.js';
import formRoutes from './routes/formsRoutes.js';
import reviewCommentRoutes from './routes/reviewCommentRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import portalAuthRoutes from './routes/portalAuthRoutes.js';
import portalProxyRoutes from './routes/portalProxyRoutes.js';
import editorRoutes from './routes/editorRoutes.js';
import { redirectTenant } from './controllers/tenantController.js';
import { loadTenants } from './services/tenantService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkHealth } from './controllers/healthController.js';
import helmet from 'helmet';
import authRoutes from './routes/userAuthInfoRoutes.js';
import { getAppInfo } from './controllers/appInfoController.js';
import { sessionMiddleware, anonymousMiddlewares } from './middlewares/conditionalSession.js';
import { envConfig } from './config/env.js';
import portalAnonymousProxyRoutes from './routes/portalAnonymousProxyRoutes.js';
import knowlgMwProxyRoutes from './routes/knowlgMwProxyRoutes.js';
import { kongProxy } from './proxies/kongProxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.set('trust proxy', true);
app.use(helmet({ contentSecurityPolicy: false }));

loadTenants();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.get('/health', checkHealth);
app.get('/portal/app/v1/info', getAppInfo);


// Portal Anonymous Routes
app.use('/portal', sessionMiddleware, ...anonymousMiddlewares, portalAnonymousProxyRoutes)
// Portal Authentication Routes (Login, Callback, Logout)
app.use('/portal', portalAuthRoutes);

// Review comment routes
app.use('/portal/review/comment/v1', sessionMiddleware, keycloak.middleware({ admin: '/home', logout: '/portal/logout' }), keycloak.protect(), reviewCommentRoutes);

// Apply anonymous session middleware to API routes (once per route tree)

app.use('/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', sessionMiddleware, ...anonymousMiddlewares, oidcSession(), authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
// Specific /action endpoints must always proxy to kong.
app.use("/action", editorRoutes);

// All remaining /action/* routes proxy to knowledge-mw-service.
// keycloak.middleware() deserializes the session grant into req.kauth so that
// decorateRequestHeaders can read the user's access token for upstream auth.
app.use('/', sessionMiddleware, ...anonymousMiddlewares, oidcSession(), knowlgMwProxyRoutes);

// Apply anonymous session middleware to portal routes (once per route tree)
app.use('/portal', sessionMiddleware, ...anonymousMiddlewares);

// Portal Proxy Routes (authenticated — oidcSession populates req.oidc for requireAuth)
app.use('/portal', oidcSession(), portalProxyRoutes);

app.use('/action', sessionMiddleware);

// Portal Proxy Routes (authenticated only)
app.all('/action/*rest', oidcSession(), requireAuth(), kongProxy);

app.get('/:tenantName', redirectTenant);

app.get(/.*/, sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    const isLocal = envConfig.ENVIRONMENT == 'local'
    if (isLocal) {
        res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
