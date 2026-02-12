import express, { Request, Response } from 'express';
import cors from 'cors';
import { envConfig } from './config/env.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { regenerateSession, regenerateAnonymousSession } from './utils/sessionUtils.js';
import formRoutes from './routes/formsRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import { validateRecaptcha } from './middlewares/googleAuth.js';
import { kongProxy } from './proxies/kongProxy.js';
import { redirectTenant } from './controllers/tenantController.js';
import { loadTenants } from './services/tenantService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkHealth } from './controllers/healthController.js';
import { userProxy } from './proxies/userProxy.js';
import helmet from 'helmet';
import authRoutes from './routes/userAuthInfoRoutes.js';
import { getAppInfo } from './controllers/appInfoController.js';
import { handlePassword } from './middlewares/passwordHandler.js';
import { sessionMiddleware, anonymousMiddlewares } from './middlewares/conditionalSession.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.set('trust proxy', true);
app.use(helmet({ contentSecurityPolicy: false }));

loadTenants();
app.use(cors({
    origin: envConfig.ENVIRONMENT === 'local' ? ['http://localhost:5173', 'http://localhost:3000'] : false,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded());
app.get('/health', checkHealth);
app.get('/app/v1/info', getAppInfo);


app.get('/portal/login',
    sessionMiddleware, ...anonymousMiddlewares, keycloak.middleware({ admin: '/callback', logout: '/portal/logout' }), keycloak.protect(), async (req: Request, res: Response) => {
        if (req.session) {
            try {
                await regenerateSession(req);
                res.redirect('/profile');
            } catch (err) {
                logger.error('Error generating session on login', err);
                res.redirect('/');
            }
        } else {
            logger.error('No session found after Keycloak protect');
            res.redirect('/');
        }
    });

app.get('/profile',
    sessionMiddleware, ...anonymousMiddlewares, keycloak.middleware({ admin: '/callback', logout: '/portal/logout' }), keycloak.protect(), async (req: Request, res: Response) => {
        if (req.session) {
            try {
                // Regenerate session to prevent fixation and set new Kong token
                await regenerateSession(req);
                if (envConfig.ENVIRONMENT === 'local') {
                    res.redirect('http://localhost:5173/profile');
                } else {
                    res.sendFile(path.join(__dirname, 'public', 'index.html'));
                }
            } catch (err) {
                logger.error('Error generating session on login', err);
                res.redirect('/');
            }
        } else {
            logger.error('No session found after Keycloak protect');
            res.redirect('/');
        }
    });

app.all('/portal/logout', sessionMiddleware, async (req, res, next) => {
    // 1. Clear Keycloak session/tokens (handled by keycloak middleware usually, but here we just process local logout)

    // 2. Regenerate to anonymous session (clears user data, gets new SID, sets new anonymous tokens)
    try {
        await regenerateAnonymousSession(req);
        // Apply anonymous middlewares to ensure org/device setup on new session if needed
        // But regenerateAnonymousSession already sets kongToken and roles.
        // We might want to run anonymousMiddlewares[1] (setAnonymousOrg) to ensure org is set?
        // setAnonymousOrg checks rootOrghashTagId. New session won't have it.
        // So we should run it.
        // However, we can just redirect to / which will run the middlewares again.
        res.redirect('/');
    } catch (err) {
        logger.error('Error regenerating session on logout', err);
        res.redirect('/');
    }
});

// Apply anonymous session middleware to API routes (once per route tree)
app.use('/api', sessionMiddleware, ...anonymousMiddlewares);
app.use('/api/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', sessionMiddleware, ...anonymousMiddlewares, authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Apply anonymous session middleware to portal routes (once per route tree)
app.use('/portal', sessionMiddleware, ...anonymousMiddlewares);

app.post('/portal/user/v1/fuzzy/search', validateRecaptcha, userProxy);
app.post('/portal/user/v1/password/reset', handlePassword, userProxy);
app.post('/portal/otp/v1/verify', kongProxy);
app.post('/portal/user/v2/signup', handlePassword, kongProxy);

const recaptchaProtectedRoutes: string[] = [
    '/portal/user/v1/exists/email/:emailId',
    '/portal/user/v1/exists/phone/:phoneNumber',
    '/portal/user/v1/get/phone/*rest',
    '/portal/user/v1/get/email/*rest',
    '/portal/otp/v1/generate',
];
app.all(recaptchaProtectedRoutes, validateRecaptcha, kongProxy);

app.all('/portal/*rest', kongProxy);

app.get('/:tenantName', redirectTenant);

app.get(/.*/, sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});