import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import { envConfig } from './config/env.js';
import { sessionStore } from './utils/sessionStore.js';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { destroySession } from './utils/sessionUtils.js';
import formRoutes from './routes/formsRoutes.js';
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
app.use(session({
    name: CookieNames.ANONYMOUS,
    store: sessionStore,
    secret: envConfig.SUNBIRD_ANONYMOUS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: envConfig.ENVIRONMENT !== 'local',
        maxAge: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL,
        sameSite: 'lax'
    }
}), registerDeviceWithKong());

app.get('/home',
    session({
        name: CookieNames.AUTH,
        store: sessionStore,
        secret: envConfig.SUNBIRD_LOGGEDIN_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: envConfig.ENVIRONMENT !== 'local',
            maxAge: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL,
            sameSite: 'lax'
        }
    }), keycloak.middleware({ admin: '/callback', logout: '/logout' }), keycloak.protect(), (req: Request, res: Response) => {
        res.clearCookie(CookieNames.ANONYMOUS);
        if (req.session) {
            req.session.save((err) => {
                if (err) {
                    logger.error('Error saving session', err);
                }
                res.redirect('/onboarding');
            });
        } else {
            res.redirect('/');
        }
    });

app.all('/portal/logout', async (req, res) => {
    res.status(200).clearCookie(CookieNames.SESSION_ID, { path: '/' });
    try {
        await destroySession(req);
    } catch (err) {
        logger.error('Error destroying session', err);
    }
    res.redirect('/');
})
app.use('/api/data/v1/form', formRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.post('/portal/data/v1/system/settings/get', kongProxy);

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
