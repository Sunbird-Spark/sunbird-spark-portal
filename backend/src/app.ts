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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.get('/health', checkHealth);
app.get('/app/v1/info', getAppInfo);

app.get('/portal/login',
    sessionMiddleware,
    (req: Request, res: Response) => {
        logger.info('DEBUG: /portal/login hit ' + JSON.stringify({
            url: req.url,
            query: req.query,
            sessionID: req.sessionID,
            cookie: req.headers.cookie,
            hasSession: !!req.session,
            hasKauth: !!_.get(req, 'kauth')
        }));

        // If already authenticated, go home
        if (req.session && _.get(req, 'kauth.grant')) {
            logger.info('User already authenticated, redirecting to home');
            return res.redirect('/home');
        }

        // Otherwise start login flow -> redirect to protected callback
        logger.info('Redirecting to /portal/auth/callback for login');
        res.redirect('/portal/auth/callback');
    }
);

app.get('/portal/auth/callback',
    sessionMiddleware,
    // Add debug logging
    (req: Request, res: Response, next: express.NextFunction) => {
        // Edge case: keycloak-connect might fail if auth_callback is present but no code/state
        // and no session. Redirect to login to restart flow.
        if (req.query.auth_callback && !req.query.code && !_.get(req, 'kauth.grant')) {
            logger.warn('Detected auth_callback without code and no session. Restarting login flow.');
            return res.redirect('/portal/login');
        }
        next();
    },
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

                logger.info('Session setup complete, redirecting to /home');
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

app.all('/portal/logout', sessionMiddleware, async (req, res) => {
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

app.all('/portal/*rest', keycloak.middleware({ admin: '/home', logout: '/portal/logout' }),
    keycloak.protect(),
    kongProxy);

app.get('/:tenantName', redirectTenant);

app.get(/.*/, sessionMiddleware, ...anonymousMiddlewares, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});