import session from 'express-session';
import { envConfig } from './env.js';
import { sessionStore } from '../utils/sessionStore.js';
import { CookieNames } from '../utils/cookieConstants.js';

export const anonymousSessionConfig: session.SessionOptions = {
    name: CookieNames.ANONYMOUS,
    store: sessionStore,
    secret: envConfig.SUNBIRD_ANONYMOUS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Will only be saved if modified (e.g. by middleware)
    cookie: {
        httpOnly: true,
        secure: envConfig.ENVIRONMENT !== 'local',
        maxAge: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL,
        sameSite: 'lax'
    }
};

export const authSessionConfig: session.SessionOptions = {
    name: CookieNames.AUTH,
    store: sessionStore,
    secret: envConfig.SUNBIRD_LOGGEDIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: envConfig.ENVIRONMENT !== 'local',
        maxAge: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL, // Using same TTL? Usually logged in sessions might have diff TTL but let's stick to existing
        sameSite: 'lax'
    }
};
