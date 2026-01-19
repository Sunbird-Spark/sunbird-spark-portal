import 'keycloak-connect';

declare module 'keycloak-connect' {
    interface Token {
        content?: {
            sub?: string;
            preferred_username?: string;
            email?: string;
            name?: string;
            given_name?: string;
            family_name?: string;
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