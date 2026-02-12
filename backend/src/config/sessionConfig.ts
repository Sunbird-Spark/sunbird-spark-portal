import session from 'express-session';
import { envConfig } from './env.js';
import { CookieNames } from '../utils/cookieConstants.js';
import { sessionStore } from '../utils/sessionStore.js';

const isLocal = envConfig.ENVIRONMENT === 'local';

export const sessionConfig: session.SessionOptions = {
    name: CookieNames.SESSION_ID,
    store: sessionStore,
    secret: envConfig.SUNBIRD_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: !isLocal,
        maxAge: envConfig.SUNBIRD_ANONYMOUS_SESSION_TTL,
        sameSite: isLocal ? 'lax' : 'none'
    } as session.SessionOptions['cookie']
};