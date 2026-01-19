import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { envConfig } from './config/env.js';
import { sessionStore } from './utils/sessionStore.js';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';

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
}));

app.use(registerDeviceWithKong());
