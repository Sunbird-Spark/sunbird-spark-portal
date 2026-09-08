import { Request } from 'express';
import * as http from 'http';
import { envConfig } from '../config/env.js';

const fallbackToken = envConfig.KONG_ANONYMOUS_FALLBACK_TOKEN;
const loggedInFallbackToken = envConfig.KONG_LOGGEDIN_FALLBACK_TOKEN;
const appId = envConfig.APPID;

/**
 * Identity / trust headers that the BFF is the sole authority for. A client must
 * never be able to assert these; http-proxy-middleware copies inbound request
 * headers onto proxyReq by default, so any of these arriving from the browser
 * would otherwise be forwarded to Kong verbatim. We strip them unconditionally in
 * decorateRequestHeaders and then re-set only the ones the server session authorizes.
 * Names are lower-cased because Node's ClientRequest.removeHeader is case-insensitive.
 */
export const INBOUND_IDENTITY_HEADERS = [
    'x-authenticated-userid',
    'x-authenticated-user-token',
    'x-auth-token',
    'x-authenticated-for',
    'x-authenticated-client-id',
    'x-authenticated-client-token',
    'x-app-id',
    'x-channel-id',
    'x-session-id',
    'x-consumer-id',
    'x-consumer-custom-id',
    'x-consumer-username',
];

export const getUserToken = (req: Request): string | undefined => {
    if (req.session?.userAccessToken) {
        return req.session.userAccessToken;
    }
    return req.oidc?.accessToken;
};

export const getBearerToken = (req: Request): string => {
    if (req.session?.kongToken) return req.session.kongToken;
    return req.session?.userId
        ? loggedInFallbackToken
        : fallbackToken;
};

export const decorateRequestHeaders = (proxyReq: http.ClientRequest, req: Request): void => {
    // Trust boundary: strip any client-supplied identity headers first, then set
    // only what the server session authorizes below. Guarded so synthetic/partial
    // ClientRequest callers (e.g. the telemetry mock) without removeHeader don't crash.
    if (typeof proxyReq.removeHeader === 'function') {
        for (const header of INBOUND_IDENTITY_HEADERS) {
            proxyReq.removeHeader(header);
        }
    }

    // Source the session id solely from the server session, never the inbound header.
    if (req.sessionID) {
        proxyReq.setHeader('X-Session-Id', req.sessionID);
    }

    // Channel is not an authenticated claim; prefer the session, keep the narrowed
    // request fallback for anonymous tenant resolution (Kong must not trust it as identity).
    const channel = req.session?.rootOrghashTagId || req.get('X-Channel-Id');
    if (channel) {
        proxyReq.setHeader('X-Channel-Id', channel);
    }

    if (req.session?.userId) {
        proxyReq.setHeader('X-Authenticated-Userid', req.session.userId);
    }

    // Always assert the server App-Id; never honor a client-supplied one.
    proxyReq.setHeader('X-App-Id', appId);

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
