import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import * as http from 'http';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';
import _ from 'lodash';

const KONG_URL = envConfig.KONG_URL;

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
            if (!_.includes([200, 201, 204], proxyRes.statusCode)) {
                logger.error(`Unauthorized access: ${req.method} ${req.url} - Status: ${proxyRes.statusCode}`,
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
