import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { destroySession, destroySessionId, getCookieValue, getUnsignedSessionId } from './utils/sessionUtils.js';
import { anonymousSessionConfig, authSessionConfig } from './config/sessionConfig.js';
import formRoutes from './routes/formsRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import { validateRecaptcha } from './middlewares/googleAuth.js';
import { kongProxy } from './proxies/kongProxy.js';
import { redirectTenant } from './controllers/tenantController.js';
import { setAnonymousOrg } from './middlewares/anonymousOrg.js';
import { loadTenants } from './services/tenantService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { CookieNames } from './utils/cookieConstants.js';
import { checkHealth } from './controllers/healthController.js';
import { userProxy } from './proxies/userProxy.js';
import helmet from 'helmet';
import authRoutes from './routes/userAuthInfoRoutes.js';
import { getAppInfo } from './controllers/appInfoController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.set('trust proxy', true);
app.use(helmet());

loadTenants();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.get('/health', checkHealth);
app.get('/app/v1/info', getAppInfo);

// Anonymous session middleware for API routes only
const anonymousSessionMiddleware = [
    session(anonymousSessionConfig),
    registerDeviceWithKong(),
    setAnonymousOrg()
];

app.get('/profile',
    session(authSessionConfig), keycloak.middleware({ admin: '/callback', logout: '/logout' }), keycloak.protect(), async (req: Request, res: Response) => {
        try {
            const anonymousCookie = getCookieValue(req.headers.cookie || '', CookieNames.ANONYMOUS);
            const anonymousSessionId = getUnsignedSessionId(anonymousCookie || '');

            if (anonymousSessionId) {
                await destroySessionId(anonymousSessionId);
                logger.info(`Destroyed anonymous session ${anonymousSessionId} during login`);
            }
        } catch (err) {
            logger.error('Error cleaning up anonymous session', err);
        }

        res.clearCookie(CookieNames.ANONYMOUS);
        if (req.session) {
            req.session.save((err) => {
                if (err) {
                    logger.error('Error saving session', err);
                }
                res.redirect('/home');
            });
        } else {
            res.redirect('/');
        }
    });

app.all('/portal/logout', session(authSessionConfig), async (req, res) => {
    try {
        await destroySession(req);
        res.clearCookie(CookieNames.AUTH);
        logger.info('User logged out and session destroyed');
    } catch (err) {
        logger.error('Error destroying session during logout', err);
    }
    res.redirect('/');
})

// Apply anonymous session middleware to API routes (once per route tree)
app.use('/api', anonymousSessionMiddleware);
app.use('/api/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', anonymousSessionMiddleware, authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public')));

// Apply anonymous session middleware to portal routes (once per route tree)
app.use('/portal', anonymousSessionMiddleware);

app.post('/portal/user/v1/fuzzy/search', validateRecaptcha, userProxy);
app.post('/portal/user/v1/password/reset', userProxy);
app.post('/portal/otp/v1/verify', kongProxy);

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

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
