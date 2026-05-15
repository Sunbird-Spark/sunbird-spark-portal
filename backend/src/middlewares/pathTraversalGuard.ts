import { Request, Response, NextFunction } from 'express';
import { Response as ApiResponse } from '../models/Response.js';
import logger from '../utils/logger.js';

const MAX_DECODE_ITERATIONS = 5;
const FORBIDDEN_RAW_PATTERNS = ['/../', '/./', '\\', '%5c', '%5C', '%00'];

const sendInvalidPath = (req: Request, res: Response, reason: string) => {
    logger.warn(
        `pathTraversalGuard :: rejected ${req.method} ${req.originalUrl} from ${req.ip} (${reason})`,
    );
    const response = new ApiResponse('api.error');
    response.setError({
        err: 'ERR_INVALID_PATH',
        errmsg: 'Invalid request path',
        responseCode: 'CLIENT_ERROR',
    });
    res.status(400).send(response);
};

const containsForbiddenChar = (segment: string): boolean =>
    segment.includes('\\') || segment.includes('\0');

export const pathTraversalGuard = (req: Request, res: Response, next: NextFunction): void => {
    const rawPath = (req.originalUrl || '').split('?')[0] ?? '';

    for (const pattern of FORBIDDEN_RAW_PATTERNS) {
        if (rawPath.includes(pattern)) {
            sendInvalidPath(req, res, `raw pattern "${pattern}"`);
            return;
        }
    }

    let decoded = rawPath;
    let iterations = 0;
    while (true) {
        let nextDecoded: string;
        try {
            nextDecoded = decodeURIComponent(decoded);
        } catch {
            sendInvalidPath(req, res, 'malformed percent-encoding');
            return;
        }
        if (nextDecoded === decoded) {
            break;
        }
        decoded = nextDecoded;
        iterations += 1;
        if (iterations > MAX_DECODE_ITERATIONS) {
            sendInvalidPath(req, res, 'decode loop did not stabilize');
            return;
        }
    }

    const segments = decoded.split('/');
    for (const segment of segments) {
        if (segment === '.' || segment === '..') {
            sendInvalidPath(req, res, `dot segment "${segment}"`);
            return;
        }
        if (containsForbiddenChar(segment)) {
            sendInvalidPath(req, res, 'forbidden character in segment');
            return;
        }
    }

    next();
};
