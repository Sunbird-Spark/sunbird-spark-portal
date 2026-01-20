import { Request } from 'express';
import * as http from 'http';
import { envConfig } from '../config/env.js';


export const getAuthToken = (req: Request): string => {
    return req.session?.kongToken || envConfig.KONG_ANONYMOUS_FALLBACK_TOKEN;
};

export const getBearerToken = (req: Request): string => {
    return req.session?.kongToken || envConfig.KONG_ANONYMOUS_FALLBACK_TOKEN;
};

export const decorateRequestHeaders = (proxyReq: http.ClientRequest, req: Request): void => {
    const sessionId = req.sessionID || req.get('X-Session-Id');
    
    if (sessionId){
        proxyReq.setHeader('X-Session-Id', sessionId);
    }
    
    const channel = req.session?.rootOrghashTagId || req.get('X-Channel-Id');
    if (channel){
        proxyReq.setHeader('X-Channel-Id', channel);
    }
    
    if (req.session?.userId) {
        proxyReq.setHeader('X-Authenticated-Userid', req.session.userId);
    }
     
    if (!req.get('X-App-Id')) {
        proxyReq.setHeader('X-App-Id', envConfig.APPID);
    }
    
    if (req.session?.managedToken) {
        proxyReq.setHeader('x-authenticated-for', req.session.managedToken);
    }
    
    const authToken = getAuthToken(req);
    if (authToken) {
        proxyReq.setHeader('x-authenticated-user-token', authToken);
        proxyReq.setHeader('x-auth-token', authToken);
    }
    
    proxyReq.setHeader('Authorization', 'Bearer ' + getBearerToken(req));
    proxyReq.setHeader('Connection', 'keep-alive');
};