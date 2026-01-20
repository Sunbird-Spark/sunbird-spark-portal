import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { envConfig } from './config/env.js';
import { sessionStore } from './utils/sessionStore.js';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { destroySession } from './utils/sessionUtils.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use(session({
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

app.use('/resources',
    session({
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
    }), keycloak.middleware({ admin: '/callback', logout: '/logout' }), keycloak.protect(), (req: express.Request, res: express.Response) => {
        res.redirect('/resources');
    });

app.get('/',
    session({
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
    }), (req: express.Request, res: express.Response) => {
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