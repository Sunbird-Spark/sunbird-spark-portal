
import 'express';

interface OIDCTokenClaims {
    sub?: string;
    preferred_username?: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    exp?: number;
    realm_access?: {
        roles?: string[];
    };
    resource_access?: {
        [key: string]: {
            roles?: string[];
        };
    };
    [key: string]: any;
}

interface OIDCAuth {
    isAuthenticated: boolean;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    tokenClaims?: OIDCTokenClaims;
    refreshTokenClaims?: {
        exp?: number;
        [key: string]: any;
    };
}

declare module 'express' {
     
    interface Request {
        oidc?: OIDCAuth;
    }
}
