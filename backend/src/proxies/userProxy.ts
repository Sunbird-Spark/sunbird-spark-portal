import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import * as http from 'http';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';

const LEARN_BASE_URL = envConfig.LEARN_BASE_URL;

export const userProxy = createProxyMiddleware({
    target: LEARN_BASE_URL,
    changeOrigin: true,
    pathRewrite: (path) => {
        if (path.startsWith('/portal/user/v1/fuzzy/search')) {
            return path.replace(
                '/portal/user/v1/fuzzy/search',
                '/private/user/v1/search'
            );
        }
        if (path.startsWith('/portal/user/v1/password/reset')) {
            return path.replace(
                '/portal/user/v1/password/reset',
                '/private/user/v1/password/reset'
            );
        }
        return path.replace('/portal', '');
    },
    on: {
        proxyReq: (proxyReq: http.ClientRequest, req: Request): void => {
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
        },
    },
});