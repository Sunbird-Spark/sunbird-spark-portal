import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { envConfig } from './config/env.js';
import { sessionStore } from './utils/sessionStore.js';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';
import { keycloak } from './config/keyclok.js';
import logger from './utils/logger.js';

export const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
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
        res.redirect('http://localhost:5173/resources');
    });

// Root route - redirect to frontend
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
        logger.info('redirected to /')
        res.redirect('http://localhost:5173/resources');
    });

app.all('/logout', (req, res) => {
    // Clear cookie for client (browser)
    logger.info('in /logout')
    res.status(200).clearCookie('connect.sid', { path: '/' });
    // Clear session pertaining to User
    req.session.destroy((err) => {
        if (err) {
            logger.error('Error destroying session', err);
        }
    });
    // Redirect directly to frontend instead of Keycloak logout
    res.redirect(keycloak.logoutUrl('http://localhost:5173/'));
})

app.get('/test', registerDeviceWithKong(), (req, res) => {
    res.json({ message: 'Test route', kongToken: req.session.kongToken });
});