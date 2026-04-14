import express from 'express';
import cors from 'cors';
import { oidcSession, requireAuth } from './auth/oidcMiddleware.js';
import formRoutes from './routes/formsRoutes.js';
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
import anonymousActionRoutes from './routes/anonymousActionRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';
import reviewCommentRoutes from './routes/reviewCommentRoutes.js';

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


// Mobile API Routes (stateless — returns tokens directly, no session)
app.use('/mobile', mobileRoutes);

// Portal Authentication Routes (Login, Callback, Logout) — registered first to bypass anonymous middleware
app.use('/portal', portalAuthRoutes);

// DIAL code redirect — works for both anonymous and authenticated users
// Separate routes: one for missing id (400), one for valid id (redirect)
app.get('/dial', sessionMiddleware, ...anonymousMiddlewares, (_req, res) => {
    res.status(400).json({ message: 'Missing dial code' });
});
app.get('/dial/:id', sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    const frontendBase = envConfig.DEVELOPMENT_REACT_APP_URL || '';
    res.redirect(`${frontendBase}/explore?dialcodes=${encodeURIComponent(req.params.id as string)}`);
});
// Portal Anonymous Routes
app.use('/portal', sessionMiddleware, ...anonymousMiddlewares, portalAnonymousProxyRoutes)

// Review comment routes
app.use('/portal/review/comment/v1', sessionMiddleware, oidcSession(), requireAuth(), reviewCommentRoutes);

// Apply anonymous session middleware to API routes (once per route tree)

app.use('/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', sessionMiddleware, ...anonymousMiddlewares, oidcSession(), authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
// Specific /action endpoints must always proxy to kong.
app.use("/action", editorRoutes);

// Anonymous-safe /action/* routes — registered BEFORE the authenticated catch-all.
// Allows the Sunbird Telemetry JS SDK to POST /action/data/v3/telemetry for
// anonymous/guest users without needing OIDC tokens.
app.use('/action', sessionMiddleware, ...anonymousMiddlewares, anonymousActionRoutes);

// All remaining /action/* routes proxy to knowledge-mw-service.
// oidcSession() deserializes the OIDC tokens from the session so that
// decorateRequestHeaders can read the user's access token for upstream auth.
app.use('/', sessionMiddleware, ...anonymousMiddlewares, oidcSession(), knowlgMwProxyRoutes);

// Portal Proxy Routes (authenticated — oidcSession populates req.oidc for requireAuth)
app.use('/portal', sessionMiddleware, oidcSession(), portalProxyRoutes);

app.get('/:tenantName', redirectTenant);

app.get(/.*/, sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    const isLocal = envConfig.ENVIRONMENT == 'local'
    if (isLocal) {
        return res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
