import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { envConfig } from './config/env.js';
import { sessionStore } from './utils/sessionStore.js';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { destroySession } from './utils/sessionUtils.js';
import { validateRecaptcha } from './middlewares/googleAuth.js';
import { kongProxy } from './proxies/kongProxy.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.use(session({
    store: sessionStore,
    secret: [envConfig.SUNBIRD_ANONYMOUS_SESSION_SECRET, envConfig.SUNBIRD_LOGGEDIN_SESSION_SECRET],
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: envConfig.ENVIRONMENT !== 'local',
        maxAge: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL,
        sameSite: 'lax'
    }
}));

app.use(registerDeviceWithKong());

app.use('/resources',
    keycloak.middleware({ admin: '/callback', logout: '/logout' }),
    keycloak.protect(), (req: express.Request, res: express.Response) => {
        res.redirect('/resources');
    });

app.get('/', (req: express.Request, res: express.Response) => {
    res.redirect('/resources');
});

app.all('/logout', async (req, res) => {
    res.status(200).clearCookie('connect.sid', { path: '/' });
    try {
        await destroySession(req);
    } catch (err) {
        logger.error('Error destroying session', err);
    }
    res.redirect(keycloak.logoutUrl('/'));
})

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
