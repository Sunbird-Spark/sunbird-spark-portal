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
import { pathTraversalGuard } from './middlewares/pathTraversalGuard.js';
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
// Content-Security-Policy.
//
// script-src must name every origin the app injects a <script> for. In
// particular the YouTube IFrame API (content-player's youtube.html adds a
// script tag for https://www.youtube.com/iframe_api, which then pulls its
// player bundle from s.ytimg.com) and reCAPTCHA — omitting either silently
// breaks YouTube telemetry/playback control and the signup captcha.
// 'unsafe-inline'/'unsafe-eval' are required by the bundled player runtimes.
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'script-src': [
                "'self'", "'unsafe-inline'", "'unsafe-eval'",
                'https://cdnjs.cloudflare.com',
                'https://www.youtube.com', 'https://s.ytimg.com',
                'https://www.google.com', 'https://www.gstatic.com', 'https://www.recaptcha.net',
            ],
            // Legacy ECML/H5P/SCORM content uses inline handler attributes;
            // helmet's default of 'none' would break it.
            'script-src-attr': null,
            'style-src': ["'self'", "'unsafe-inline'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:', 'https:'],
            'media-src': ["'self'", 'data:', 'blob:', 'https:'],
            'font-src': ["'self'", 'data:', 'https:'],
            'connect-src': ["'self'", 'https:', 'wss:'],
            'frame-src': ["'self'", 'https:'],
            'worker-src': ["'self'", 'blob:'],
            'object-src': ["'none'"],
            // Keep plain-http local/prod-mode serving working (no forced https upgrade).
            upgradeInsecureRequests: null,
        },
    },
}));

// Paths serving packaged third-party content (ECML/H5P/SCORM archives, editor
// plugins). What those bundles load cannot be enumerated ahead of time, so the
// policy is lifted for them rather than enforced with an allowlist that will
// break them — a CSP covering these paths was tried once before and reverted a
// day later. Everything else (the SPA, APIs) keeps the policy above.
const CSP_EXEMPT_PATHS = [
    '/content/preview', '/content-player', '/content-plugins',
    '/plugins', '/content-editor', '/generic-editor', '/editor',
];
app.use((req, res, next) => {
    // Match on a path-segment boundary so /content/previewX isn't exempted too.
    if (CSP_EXEMPT_PATHS.some((p) => req.path === p || req.path.startsWith(`${p}/`))) {
        res.removeHeader('Content-Security-Policy');
    }
    next();
});
app.use(pathTraversalGuard);

loadTenants();
// CORS: same-origin in production (backend serves the SPA build), so cross-origin
// access is limited to the dev frontend and the mobile app's webview origins.
const corsAllowedOrigins = [
    ...(envConfig.CORS_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean),
    ...(envConfig.DEVELOPMENT_REACT_APP_URL ? [envConfig.DEVELOPMENT_REACT_APP_URL.replace(/\/$/, '')] : []),
    // Vite dev server origin
    'http://localhost:5173',
    // Capacitor/Ionic webview origins used by the mobile app
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
];
app.use(cors({ origin: corsAllowedOrigins }));
app.use(express.json({ limit: '50mb' }));
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
