import { Request } from 'express';
import * as http from 'http';
import { envConfig } from '../config/env.js';

const fallbackToken = envConfig.KONG_ANONYMOUS_FALLBACK_TOKEN;
const loggedInFallbackToken = envConfig.KONG_LOGGEDIN_FALLBACK_TOKEN;
const appId = envConfig.APPID;

export const getUserToken = (req: Request): string | undefined => {
    return req.oidc?.accessToken;
};

export const getBearerToken = (req: Request): string => {
    if (req.session?.kongToken) return req.session.kongToken;
    return req.session?.userId
        ? loggedInFallbackToken
        : fallbackToken;
};

export const decorateRequestHeaders = (proxyReq: http.ClientRequest, req: Request): void => {
    const sessionId = req.sessionID || req.get('X-Session-Id');

    if (sessionId) {
        proxyReq.setHeader('X-Session-Id', sessionId);
    }

    const channel = req.session?.rootOrghashTagId || req.get('X-Channel-Id');
    if (channel) {
        proxyReq.setHeader('X-Channel-Id', channel);
    }

    if (req.session?.userId) {
        proxyReq.setHeader('X-Authenticated-Userid', req.session.userId);
    }

    if (!req.get('X-App-Id')) {
        proxyReq.setHeader('X-App-Id', appId);
    }

    if (req.session?.managedToken) {
        proxyReq.setHeader('x-authenticated-for', req.session.managedToken);
    }

    const userToken = getUserToken(req);
    if (userToken) {
        proxyReq.setHeader('x-authenticated-user-token', userToken);
        proxyReq.setHeader('x-auth-token', userToken);
    }

    proxyReq.setHeader('Authorization', 'Bearer ' + getBearerToken(req));
    proxyReq.setHeader('Connection', 'keep-alive');
};
