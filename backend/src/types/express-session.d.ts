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
        orgs?: string[];
        userSid?: string;
        userName?: string;
        rootOrghashTagId?: string;
        rootOrg?: {
            id?: string;
            slug?: string;
            orgName?: string;
            channel?: string;
            hashTagId?: string;
            rootOrgId?: string;
        }
        anonymousOrg?: {
            id?: string;
            slug?: string;
            channel?: string;
            hashTagId?: string;
            orgName?: string;
        };
        managedToken?: string;
        logSession?: boolean;
        deviceId?: string;
        'keycloak-token'?: {
            access_token?: string;
            refresh_token?: string;
            id_token?: string;
            expires_in?: number;
            refresh_expires_in?: number;
            token_type?: string;
            session_state?: string;
            scope?: string;
            [key: string]: any;
        };
        auth_redirect_uri?: string;
        googleOAuth?: {
            nonce: string;
            state: string;
            client_id: string;
            redirect_uri: string;
            error_callback: string;
            timestamp: number;
            sessionUsed?: boolean;
        };
    }
}