import express, { Request, Response } from 'express';
import { keycloak } from '../auth/keycloakProvider.js';
import logger from '../utils/logger.js';
import { regenerateSession, regenerateAnonymousSession } from '../utils/sessionUtils.js';
import { setSessionTTLFromToken } from '../utils/sessionTTLUtil.js';
import { fetchUserById, setUserSession } from '../services/userService.js';
import { envConfig } from '../config/env.js';
import { sessionMiddleware } from '../middlewares/conditionalSession.js';
import _ from 'lodash';

const router = express.Router();

router.get('/login',
    sessionMiddleware,
    (req: Request, res: Response) => {
        logger.info('DEBUG: /portal/login hit ' + JSON.stringify({
            url: req.url,
            query: req.query,
            sessionID: req.sessionID ? '[REDACTED]' : undefined,
            cookie: req.headers.cookie ? '[REDACTED]' : undefined,
            hasSession: !!req.session,
            hasKauth: !!_.get(req, 'kauth')
        }));

        // If already authenticated, go home
        if (req.session && _.get(req, 'kauth.grant')) {
            logger.info('User already authenticated, redirecting to home');
            return res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL + '/home');
        }

        // Otherwise start login flow -> redirect to protected callback
        logger.info('Redirecting to /portal/auth/callback for login');
        res.redirect('/portal/auth/callback');
    }
);

router.get('/auth/callback',
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
                res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL + '/home');
            } catch (err) {
                logger.error('Error generating session on login', err);
                res.redirect(envConfig.DEVELOPMENT_REACT_APP_URL || '/');
            }
        } else {
            logger.error('No session found after Keycloak protect');
            res.redirect('/');
        }
    }
);

router.all('/logout', sessionMiddleware, async (req: Request, res: Response) => {
    // 1. Clear Keycloak session/tokens (handled by keycloak middleware usually, but here we just process local logout)
    // 2. Regenerate to anonymous session (clears user data, gets new SID, sets new anonymous tokens)
    try {
        await regenerateAnonymousSession(req);
        // Redirect to Keycloak logout
        const logoutUrl = `${envConfig.DOMAIN_URL}/auth/realms/${envConfig.PORTAL_REALM}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(envConfig.DEVELOPMENT_REACT_APP_URL || envConfig.SERVER_URL + '/')}`;
        res.redirect(logoutUrl);
    } catch (err) {
        logger.error('Error regenerating session on logout', err);
        res.redirect('/');
    }
});

export default router;
