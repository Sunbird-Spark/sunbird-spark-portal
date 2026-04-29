import session from 'express-session';
import { envConfig } from './env.js';

import { sessionStore } from '../utils/sessionStore.js';

const isLocal = envConfig.ENVIRONMENT === 'local';

if (!envConfig.SUNBIRD_SESSION_SECRET) {
    throw new Error('SUNBIRD_SESSION_SECRET is required');
}

export const sessionConfig: session.SessionOptions = {
    name: 'connect.sid',
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