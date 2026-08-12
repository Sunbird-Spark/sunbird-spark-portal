/**
 * Viewer Service Proxy
 *
 * Proxies progress/score consumption routes to the Viewer Service (see
 * `[Design] - Viewer Service.md`): granular view-lifecycle APIs
 * (start/update/assess/end/read) and summary APIs (list/read/delete/download),
 * replacing the legacy content/state/read|update + enrollment/list triad for
 * Learning Path consumption.
 *
 * The Viewer Service is hosted alongside the other learner/user-org APIs, so
 * it is proxied to LEARN_BASE_URL (same target as userProxy.ts), not KONG_URL.
 */

import { createProxyMiddleware, fixRequestBody, responseInterceptor } from 'http-proxy-middleware';
import { Request } from 'express';
import * as http from 'http';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';

const LEARN_BASE_URL = envConfig.LEARN_BASE_URL;

export const viewerProxy = createProxyMiddleware({
    target: LEARN_BASE_URL,
    changeOrigin: true,
    secure: false,
    selfHandleResponse: true,
    pathRewrite: {
        '^/portal': '',
    },
    on: {
        proxyReq: (proxyReq: http.ClientRequest, req: Request): void => {
            logger.info(`[ViewerProxy] Proxying request: ${req.method} ${req.originalUrl} to ${proxyReq.path}`);
            decorateRequestHeaders(proxyReq, req);
            if (req.body) {
                fixRequestBody(proxyReq, req);
            }
        },
        proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode || 500;
            if (statusCode >= 400) {
                const body = responseBuffer.toString('utf8');
                logger.error(`[ViewerProxy] Error proxying request: ${req.method} ${req.url} - Status: ${statusCode}`,
                    {
                        proxyStatusCode: statusCode,
                        proxyHeaders: proxyRes.headers,
                        clientStatusCode: res.statusCode,
                        errorMessage: body,
                    }
                );
            }
            return responseBuffer;
        }),
    },
});
