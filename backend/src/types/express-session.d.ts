import 'express-session';

/**
 * Extend the SessionData interface to include custom session properties.
 * This allows TypeScript to recognize custom properties stored in req.session.
 */
declare module 'express-session' {
    interface SessionData {
        userId?: number;
        username?: string;
        user?: {
            id: number;
            profile: {
                name: string;
                roles: string[];
            };
        };
        count?: number;
        kongToken?: string;
        roles?: string[];
        managedToken?: string;
        rootOrghashTagId?: string;
        rootOrgId?: string;
        logSession?: boolean;
        deviceId?: string;
    }
}