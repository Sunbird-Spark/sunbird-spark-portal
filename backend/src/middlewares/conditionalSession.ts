import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import { authSessionConfig, anonymousSessionConfig } from '../config/sessionConfig.js';
import { registerDeviceWithKong } from './kongAuth.js';
import { setAnonymousOrg } from './anonymousOrg.js';
import { CookieNames } from '../utils/cookieConstants.js';

export const authSessionMiddleware = session(authSessionConfig);

const anonymousSessionMiddlewares = [
    session(anonymousSessionConfig),
    registerDeviceWithKong(),
    setAnonymousOrg()
];

export const conditionalSessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const cookies = req.headers.cookie || '';
    const hasAuthCookie = cookies.includes(`${CookieNames.AUTH}=`);

    if (hasAuthCookie) {
        return authSessionMiddleware(req, res, next);
    }

    // Execute anonymous session middleware chain
    let index = 0;
    const runChain = (err?: any) => {
        if (err || index >= anonymousSessionMiddlewares.length) {
            return next(err);
        }
        const middleware = anonymousSessionMiddlewares[index++];
        if (middleware) {
            try {
                middleware(req, res, runChain);
            } catch (error) {
                next(error);
            }
        } else {
            next();
        }
    };

    runChain();
};
