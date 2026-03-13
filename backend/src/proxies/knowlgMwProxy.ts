/**
 * Content Editor Proxy – Knowledge MW Service
 *
 * Ports all `contentProxyUrl` routes from the reference SunbirdEd-portal
 * contentEditorProxy.js to http-proxy-middleware for Express/TypeScript.
 *
 * Target: KNOWLG_MW_BASE_URL (defaults to knowledge-mw-service:5000)
 *
 * Proxy middlewares exported:
 *  - contentUploadProxy        → /action/content/v3/upload/*
 *  - contentActionProxy        → /action/* (catch-all for remaining action routes)
 */

import { createProxyMiddleware, fixRequestBody, responseInterceptor } from 'http-proxy-middleware';
import { Request } from 'express';
import * as http from 'http';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';

const KNOWLG_MW_BASE_URL = envConfig.KNOWLG_MW_BASE_URL;

// ─── Action Catch-All Proxy ──────────────────────────────────────────────────
// Route: /action/*
// Behaviour: catch-all for any /action/* route not matched by a more specific handler.

export const contentActionProxy = createProxyMiddleware({
    target: KNOWLG_MW_BASE_URL,
    changeOrigin: true,
    secure: false,
    selfHandleResponse: true,
    pathRewrite: {
        '^/portal/lock': '/action/lock', // Lock apis proxy to knowledge-mw-service
    },
    on: {
        proxyReq: (proxyReq: http.ClientRequest, req: Request): void => {
            logger.info(`[ContentProxy:action] Proxying request: ${req.method} ${req.originalUrl} to ${proxyReq.path}`);
            decorateRequestHeaders(proxyReq, req);
            if (req.body) {
                fixRequestBody(proxyReq, req);
            }
        },
        proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req) => {
            const statusCode = proxyRes.statusCode || 500;
            if (statusCode >= 400) {
                const body = responseBuffer.toString('utf8');
                logger.error(`[ContentProxy:action] Error proxying request: ${req.method} ${req.url} - Status: ${statusCode} - Response: ${body}`);
            }
            return responseBuffer;
        }),
    },
});
