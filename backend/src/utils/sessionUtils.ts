import type { Request } from 'express';
import logger from './logger.js';
import { generateLoggedInKongToken } from '../services/kongAuthService.js';
import { sessionStore } from './sessionStore.js';

export const getCookieValue = (header: string, name: string): string | null => {
    if (!header) return null;
    const match = header.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match && match[2]) {
        return decodeURIComponent(match[2]);
    }
    return null;
};

export const getUnsignedSessionId = (cookieValue: string): string | null => {
    if (!cookieValue) return null;
    if (cookieValue.slice(0, 2) === 's:') {
        return cookieValue.slice(2).split('.')[0] ?? null;
    }
    // If not signed, return as is (unlikely with secret set)
    return cookieValue;
};

export const destroySessionId = (sid: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        sessionStore.destroy(sid, (err) => {
            if (err) {
                logger.error(`Error destroying session ID ${sid}:`, err);
                reject(err);
            } else {
                logger.info(`Session ID ${sid} destroyed successfully`);
                resolve();
            }
        });
    });
};

export const saveSession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        req.session.save((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const regenerateSession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        const oldSessionID = req.sessionID;
        const keycloakToken = req.session['keycloak-token'];
        const auth_redirect_uri = req.session.auth_redirect_uri;
        
        req.session.regenerate(async (err) => {
            if (err) {
                reject(err);
            } else {
                try {
                    logger.info(`Session regenerated ${oldSessionID}->${req.sessionID}`)

                    if (keycloakToken) {
                        req.session['keycloak-token'] = keycloakToken;
                        logger.info(`req.session['keycloak-token'], ${req.session['keycloak-token']}`)
                    }
                    if (auth_redirect_uri) {
                        req.session.auth_redirect_uri = auth_redirect_uri;
                        logger.info(`req.session.auth_redirect_uri ${auth_redirect_uri}`)
                    }
                    const newKongToken = await generateLoggedInKongToken(req);
                    req.session.kongToken = newKongToken;

                    req.session.save((saveErr) => {
                        if (saveErr) {
                            logger.error('Error saving regenerated session:', saveErr);
                            reject(saveErr);
                        } else {
                            logger.info('Regenerated session saved successfully');
                            resolve();
                        }
                    });
                } catch (tokenErr) {
                    logger.error('Error generating new Kong token:', tokenErr);
                    reject(tokenErr);
                }
            }
        });
    });
};

export const destroySession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        req.session.destroy((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};