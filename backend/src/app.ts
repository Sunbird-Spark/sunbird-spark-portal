import express, { Request, Response } from 'express';
import cors from 'cors';
import { envConfig } from './config/env.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { destroySession } from './utils/sessionUtils.js';
import formRoutes from './routes/formsRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import { validateRecaptcha } from './middlewares/googleAuth.js';
import { kongProxy } from './proxies/kongProxy.js';
import { redirectTenant } from './controllers/tenantController.js';
import { loadTenants } from './services/tenantService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { CookieNames } from './utils/cookieConstants.js';
import { checkHealth } from './controllers/healthController.js';
import { userProxy } from './proxies/userProxy.js';
import helmet from 'helmet';
import authRoutes from './routes/userAuthInfoRoutes.js';
import { getAppInfo } from './controllers/appInfoController.js';
import { handlePassword } from './middlewares/passwordHandler.js';
import { conditionalSessionMiddleware, authSessionMiddleware } from './middlewares/conditionalSession.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.set('trust proxy', true);
app.use(helmet({
    contentSecurityPolicy: false
}));

loadTenants();
app.use(cors({
    origin: envConfig.ENVIRONMENT === 'local' ? ['http://localhost:5173', 'http://localhost:3000'] : false,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded());
app.get('/health', checkHealth);
app.get('/app/v1/info', getAppInfo);

app.get('/profile',
    authSessionMiddleware, keycloak.middleware({ admin: '/callback', logout: '/logout' }), keycloak.protect(), (req: Request, res: Response) => {
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

app.all('/portal/logout', authSessionMiddleware, async (req, res) => {
    res.clearCookie(CookieNames.AUTH);
    res.status(200).clearCookie(CookieNames.SESSION_ID, { path: '/' });
    try {
        await destroySession(req);
    } catch (err) {
        logger.error('Error destroying session', err);
    }
    res.redirect('/');
})

// Apply anonymous session middleware to API routes (once per route tree)
app.use('/api', conditionalSessionMiddleware);
app.use('/api/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', conditionalSessionMiddleware, authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Apply anonymous session middleware to portal routes (once per route tree)
app.use('/portal', conditionalSessionMiddleware);

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

app.get(/.*/, conditionalSessionMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
