import express, { Request, Response } from 'express';
import cors from 'cors';
import { envConfig } from './config/env.js';
import { keycloak } from './auth/keycloakProvider.js';
import logger from './utils/logger.js';
import { regenerateSession, regenerateAnonymousSession } from './utils/sessionUtils.js';
import { setSessionTTLFromToken } from './utils/sessionTTLUtil.js';
import { fetchUserById, setUserSession } from './services/userService.js';
import formRoutes from './routes/formsRoutes.js';
import googleRoutes from './routes/googleRoutes.js';
import { validateRecaptcha } from './middlewares/googleAuth.js';
import { kongProxy } from './proxies/kongProxy.js';
import { redirectTenant } from './controllers/tenantController.js';
import { loadTenants } from './services/tenantService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkHealth } from './controllers/healthController.js';
import { userProxy } from './proxies/userProxy.js';
import helmet from 'helmet';
import authRoutes from './routes/userAuthInfoRoutes.js';
import { getAppInfo } from './controllers/appInfoController.js';
import { handlePassword } from './middlewares/passwordHandler.js';
import { sessionMiddleware, anonymousMiddlewares } from './middlewares/conditionalSession.js';
import _ from 'lodash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.set('trust proxy', true);
app.use(helmet({ contentSecurityPolicy: false }));

loadTenants();
app.use(cors({
    origin: envConfig.ENVIRONMENT === 'local' ? ['http://localhost:5173', 'http://localhost:3000'] : false,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded());
app.get('/health', checkHealth);
app.get('/app/v1/info', getAppInfo);




app.get('/portal/login',
    sessionMiddleware,
    keycloak.middleware({ admin: '/home', logout: '/portal/logout' }),
    keycloak.protect(),
    (req, res) => {
        // This handler will only be reached if the user is already authenticated
        // OR if they just logged in and Keycloak redirected them back here.
        // However, keycloak-connect often redirects to the "clean" URL after login.
        // To be safe, we just redirect to home if we get here.
        res.redirect('/home');
    }
);

// New route to handle the actual post-login logic if needed,
// but for now, let's try to rely on the fact that once logged in,
// the user hits /portal/login again and falls through to the handler above.
//
// WAIT. The issue is that the handler above WAS NOT HIT.
//
// Let's try a different approach:
// 1. /portal/login -> simple redirect to a protected route /portal/auth/callback
// 2. /portal/auth/callback -> protected -> runs our logic -> redirects to /home

app.get('/portal/auth/callback',
    sessionMiddleware,
    keycloak.middleware({ admin: '/home', logout: '/portal/logout' }),
    keycloak.protect(),
    async (req: Request, res: Response) => {
        logger.info('Entered /portal/auth/callback handler');
        if (req.session) {
            try {
                // Regenerate session
                await regenerateSession(req);
                setSessionTTLFromToken(req);

                // Initialize user session
                const tokenSubject = _.get(req, 'kauth.grant.access_token.content.sub');
                if (tokenSubject) {
                    const userIdFromToken = _.last(_.split(tokenSubject, ':'));
                    req.session.userId = userIdFromToken;

                    if (userIdFromToken) {
                        const userProfileResponse = await fetchUserById(userIdFromToken, req);
                        await setUserSession(req, userProfileResponse);
                    }
                }

                res.redirect('/home');
            } catch (err) {
                logger.error('Error generating session on login', err);
                res.redirect('/');
            }
        } else {
            logger.error('No session found after Keycloak protect');
            res.redirect('/');
        }
    }
);

// app.get('/profile', ... (commented out code remains commented out)

app.all('/portal/logout', sessionMiddleware, async (req, res, next) => {
    // 1. Clear Keycloak session/tokens (handled by keycloak middleware usually, but here we just process local logout)
    // 2. Regenerate to anonymous session (clears user data, gets new SID, sets new anonymous tokens)
    try {
        await regenerateAnonymousSession(req);
        // Redirect to Keycloak logout
        const logoutUrl = `${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(envConfig.SERVER_URL + '/')}`;
        res.redirect(logoutUrl);
    } catch (err) {
        logger.error('Error regenerating session on logout', err);
        res.redirect('/');
    }
});

// Apply anonymous session middleware to API routes (once per route tree)
app.use('/api', sessionMiddleware, ...anonymousMiddlewares);
app.use('/api/data/v1/form', formRoutes);
app.use('/portal/user/v1/auth', sessionMiddleware, ...anonymousMiddlewares, keycloak.middleware({ admin: '/home', logout: '/portal/logout' }), authRoutes);
app.use('/google', googleRoutes);

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Apply anonymous session middleware to portal routes (once per route tree)
app.use('/portal', sessionMiddleware, ...anonymousMiddlewares);

app.post('/portal/user/v1/fuzzy/search', validateRecaptcha, userProxy);
app.post('/portal/user/v1/password/reset', handlePassword, userProxy);
app.post('/portal/otp/v1/verify', kongProxy);
app.post('/portal/user/v2/signup', handlePassword, kongProxy);

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

app.get(/.*/, sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});