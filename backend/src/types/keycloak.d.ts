import 'keycloak-connect';

declare module 'keycloak-connect' {
    interface Token {
        token?: string;
        content?: {
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
        };
    }
}