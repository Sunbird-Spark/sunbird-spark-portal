import { createProxyMiddleware, fixRequestBody, responseInterceptor } from 'http-proxy-middleware';
import { Request } from 'express';
import * as http from 'http';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import logger from '../utils/logger.js';
import { envConfig } from '../config/env.js';

const KONG_URL = envConfig.KONG_URL;

export const kongProxy = createProxyMiddleware({
    target: KONG_URL,
    changeOrigin: true,
    secure: false,
    selfHandleResponse: true,
    pathRewrite: {
        '^/portal': '/',
        '^/action': '/',
        '^/api': '/',
    },
    on: {
        proxyReq: (proxyReq: http.ClientRequest, req: Request): void => {
            logger.info(`Proxying request: ${req.method} ${req.originalUrl} to ${proxyReq.path}`);
            decorateRequestHeaders(proxyReq, req);
            if (req.body) {
                fixRequestBody(proxyReq, req);
            }
        },
        proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode || 500;
            if (statusCode >= 400) {
                const body = responseBuffer.toString('utf8');
                logger.error(`Error proxying request: ${req.method} ${req.url} - Status: ${statusCode}`,
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
