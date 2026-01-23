import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { envConfig } from './config/env.js';
import { sessionStore } from './utils/sessionStore.js';
import { registerDeviceWithKong } from './middlewares/kongAuth.js';
import { validateRecaptcha } from './middlewares/googleAuth.js';
import { kongProxy } from './proxies/kongProxy.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

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

app.use(express.static(path.join(__dirname, 'public')));

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

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});