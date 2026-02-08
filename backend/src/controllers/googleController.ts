import crypto from 'crypto';
import { app } from '../app.js';
import googleOauth from '../services/googleAuthService.js';
import { envConfig } from '@/config/env.js';
import { fetchUserByEmailId, createUserWithMailId } from '@/services/userService.js';
import { createSession } from '@/services/googleAuthService.js';
import { Request, Response } from 'express';
import logger from '../utils/logger.js';

app.get('/google/auth', (req, res) => {
    try {
        if (!req.query.client_id || !req.query.redirect_uri || !req.query.error_callback) {
            return res.redirect('/');
        }

        const redirectUrl = new URL(req.query.redirect_uri as string);
        const errorCallbackUrl = new URL(req.query.error_callback as string);
        
        if (!envConfig.DOMAIN_URL) {
            throw new Error('DOMAIN_URL is not defined');
        }
        const parsedUrl = new URL(envConfig.DOMAIN_URL);
        const ALLOWED_HOSTS = [parsedUrl.hostname];

        if (!ALLOWED_HOSTS.includes(redirectUrl.hostname)) {
            return res.status(400).send('INVALID_REDIRECT_URI');
        }

        if (!ALLOWED_HOSTS.includes(errorCallbackUrl.hostname)) {
            return res.status(400).send('INVALID_ERROR_CALLBACK_URI');
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
    } catch (error) {
        logger.error('Error initializing Google OAuth:', error);
        const errorCallback = req.query.error_callback as string || '/';
        return res.redirect(`${errorCallback}?error=GOOGLE_AUTH_INIT_FAILED`);
    }
});

app.get('/google/auth/callback', async (req: Request, res: Response) => {
    let redirectUrl: string = '/?error=GOOGLE_SIGN_IN_FAILED';

    try {
        if (!req.session.googleOAuth) {
            throw new Error('OAUTH_SESSION_MISSING');
        }

        const { state, nonce, client_id } =
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

        let userExists;
        try {
            userExists = await fetchUserByEmailId(googleUser.emailId, req);
        } catch (error) {
            logger.error('Error fetching user by email:', error);
            throw new Error('FETCH_USER_FAILED');
        }

        if (!userExists) {
            try {
                await createUserWithMailId(googleUser, client_id, req);
            } catch (error) {
                logger.error('Error creating user:', error);
                throw new Error('CREATE_USER_FAILED');
            }
        }

        try {
            await createSession(
                googleUser.emailId,
                req,
                res
            );
        } catch (error) {
            logger.error('Error creating session:', error);
            throw new Error('SESSION_CREATION_FAILED');
        }

        redirectUrl = userExists ? '/home' : '/onboarding';
        return res.redirect(redirectUrl);
    } catch (error) {
        logger.error('Error in Google OAuth callback:', error);
        redirectUrl =
            (req.session?.googleOAuth?.error_callback || '/') +
            '?error=GOOGLE_SIGN_IN_FAILED';
        return res.redirect(redirectUrl);
    } finally {
        delete req.session.googleOAuth;
    }
});
