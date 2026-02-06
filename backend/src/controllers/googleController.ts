import crypto from 'crypto';
import { app } from '../app.js';
import googleOauth from '../services/googleAuthService.js';
import { envConfig } from '@/config/env.js';
import { fetchUserByEmailId, createUserWithMailId } from '@/services/userService.js';
import { createSession } from '@/services/googleAuthService.js';
import { Request, Response } from 'express';

app.get('/google/auth', (req, res) => {
    if (!req.query.client_id || !req.query.redirect_uri || !req.query.error_callback) {
        return res.redirect('/');
    }

    const redirectUrl = new URL(req.query.redirect_uri as string);
    if (!envConfig.DOMAIN_URL) {
        throw new Error('DOMAIN_URL is not defined');
    }
    const parsedUrl = new URL(envConfig.DOMAIN_URL);
    const ALLOWED_HOSTS = [parsedUrl.hostname];

    if (!ALLOWED_HOSTS.includes(redirectUrl.hostname)) {
        return res.status(400).send('INVALID_REDIRECT_URI');
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const state = crypto.randomBytes(32).toString('hex');

    req.session.googleOAuth = {
        nonce,
        state,
        client_id: req.query.client_id as string,
        redirect_uri: req.query.redirect_uri as string,
        error_callback: req.query.error_callback as string
    };

    const authUrl = googleOauth.generateAuthUrl({
        nonce,
        state,
        req
    });

    return res.redirect(authUrl);
});

app.get('/google/auth/callback', async (req: Request, res: Response) => {
    let redirectUrl: string = '/?error=GOOGLE_SIGN_IN_FAILED';

    try {
        if (!req.session.googleOAuth) {
            throw new Error('OAUTH_SESSION_MISSING');
        }

        const { state, nonce, client_id, error_callback } =
            req.session.googleOAuth;

        if (req.query.state !== state) {
            throw new Error('INVALID_OAUTH_STATE');
        }

        const googleUser = await googleOauth.verifyAndGetProfile({
            code: req.query.code as string,
            nonce,
            req
        });

        if (!googleUser.emailId) {
            throw new Error('GOOGLE_EMAIL_NOT_FOUND');
        }

        // Check user existence
        let userExists = await fetchUserByEmailId(googleUser.emailId, req);
        const isNewUser = !userExists;

        if (isNewUser) {
            await createUserWithMailId(googleUser, client_id, req);
        }

        // Create Keycloak session ONLY after Google verification
        await createSession(
            googleUser.emailId,
            req,
            res
        );

        // Redirect based on user status
        redirectUrl = isNewUser ? '/onboarding' : '/home';
    } catch (err) {
        redirectUrl =
            (req.session?.googleOAuth?.error_callback || '/library') +
            '?error=GOOGLE_SIGN_IN_FAILED';
    } finally {
        delete req.session.googleOAuth;
        return res.redirect(redirectUrl);
    }
});
