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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

loadTenants();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.use(session({
    name: 'anonymous_cookie',
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

app.get('/portal/login',
    session({
        name: 'auth_cookie',
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
        res.redirect('/resourcepage');
    });

app.all('/portal/logout', async (req, res) => {
    res.status(200).clearCookie('connect.sid', { path: '/' });
    try {
        await destroySession(req);
    } catch (err) {
        logger.error('Error destroying session', err);
    }
    res.redirect('/');
})
app.use('/api/data/v1/form', formRoutes);

if (envConfig.ENVIRONMENT !== 'local') {
    app.use(express.static(path.join(__dirname, 'public')));
}

const recaptchaProtectedRoutes: string[] = [
    '/portal/user/v1/exists/email/:emailId',
    '/portal/user/v1/exists/phone/:phoneNumber',
    '/portal/user/v1/fuzzy/search',
    '/portal/user/v1/get/phone/*rest',
    '/portal/user/v1/get/email/*rest',
    '/portal/anonymous/otp/v1/generate',
];
app.all(recaptchaProtectedRoutes, validateRecaptcha, kongProxy);

app.all('/portal/*rest', kongProxy);

app.get('/:tenantName', redirectTenant);

if (envConfig.ENVIRONMENT !== 'local') {
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}
