import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import * as http from 'http';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';

const KONG_URL = envConfig.KONG_URL || 'http://localhost:8000';

export const kongProxy = createProxyMiddleware({
    target: KONG_URL,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
        '^/portal': '/api'
    },
    on: {
        proxyReq: (proxyReq: http.ClientRequest, req: Request): void => {
            logger.info(`Proxying request: ${req.method} ${req.originalUrl} to ${proxyReq.path}`);
            decorateRequestHeaders(proxyReq, req);
            if (req.body) {
                fixRequestBody(proxyReq, req);
            }
        },
        proxyRes: (proxyRes: http.IncomingMessage, req: Request, res: Response) => {
            if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
                logger.error(`Error proxying request: ${req.method} ${req.url} - Status: ${proxyRes.statusCode}`,
                    {
                        proxyStatusCode: proxyRes.statusCode,
                        proxyHeaders: proxyRes.headers,
                        clientStatusCode: res.statusCode,
                    }
                );
            }
        }
    },
});