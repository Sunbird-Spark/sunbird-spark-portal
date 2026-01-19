import 'express-session';

/**
 * Extend the SessionData interface to include custom session properties.
 * This allows TypeScript to recognize custom properties stored in req.session.
 */
declare module 'express-session' {
    interface SessionData {
        userId?: number | string;
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
        userAccessToken?: string;
        roles?: string[];
        permissions?: string[];
        keycloakToken?: string;
        rootOrgId?: string;
        sessionEvents?: string[];
        realm?: string;
        auth_redirect_uri?: string;
        orgs?: string[];
        userSid?: string;
        userName?: string;
        managedToken?: string;
        rootOrghashTagId?: string;
        rootOrg?: {
            id?: string;
            slug?: string;
            orgName?: string;
            channel?: string;
            hashTagId?: string;
            rootOrgId?: string;
        }
    }
}