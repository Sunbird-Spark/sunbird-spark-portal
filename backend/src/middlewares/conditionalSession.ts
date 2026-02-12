import session from 'express-session';
import { sessionConfig } from '../config/sessionConfig.js';
import { registerDeviceWithKong } from './kongAuth.js';
import { setAnonymousOrg } from './anonymousOrg.js';

export const sessionMiddleware = session(sessionConfig);

export const anonymousMiddlewares = [
    registerDeviceWithKong(),
    setAnonymousOrg()
];

// For backward compatibility or ease of use, we can export a combined array if needed,
// but for now we follow the plan to separate them or usage patterns.
// Actually, to match the plan: "Remove `conditionalSessionMiddleware` logic... Export single `sessionMiddleware`... Export `anonymousMiddleware` logic"