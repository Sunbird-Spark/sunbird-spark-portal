import express from 'express';
import cors from 'cors';
import { keycloak } from './auth/keycloakProvider.js';
import formRoutes from './routes/formsRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import portalAuthRoutes from './routes/portalAuthRoutes.js';
import portalProxyRoutes from './routes/portalProxyRoutes.js';
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
app.get('/app/v1/info', getAppInfo);

// Portal Authentication Routes (Login, Callback, Logout)
app.use('/portal', portalAuthRoutes);

// Apply anonymous session middleware to API routes (once per route tree)
app.use('/api', sessionMiddleware, ...anonymousMiddlewares);
app.use('/api/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', sessionMiddleware, ...anonymousMiddlewares, keycloak.middleware({ admin: '/home', logout: '/portal/logout' }), authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Apply anonymous session middleware to portal routes (once per route tree)
app.use('/portal', sessionMiddleware, ...anonymousMiddlewares);

// Portal Proxy Routes
app.use('/portal', portalProxyRoutes);

app.get('/:tenantName', redirectTenant);

app.get(/.*/, sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    const isLocal = envConfig.ENVIRONMENT == 'local'
    if (isLocal) {
        res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});