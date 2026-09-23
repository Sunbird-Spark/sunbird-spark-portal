import axios from 'axios';
import { issuerUrl, decodeJwtPayload } from '../auth/oidcProvider.js';
import logger from '../utils/logger.js';

/**
 * Creates a Keycloak session for an SSO-authenticated user using the
 * Resource Owner Password Credentials grant with the provider's confidential
 * client (KEYCLOAK_<PROVIDER>_CLIENT_ID/SECRET). Keycloak recognises the email as
 * a federated user for that provider and issues portal-scoped access/refresh/id
 * tokens without requiring a browser redirect.
 *
 * This mirrors the reference `createSession → obtainDirectly(emailId)` approach
 * from the SunbirdEd portal.
 */
export const createKeycloakSsoSession = async (
    provider: string,
    emailId: string,
    keycloakClientId: string,
    keycloakClientSecret: string
): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    tokenClaims: Record<string, unknown> | null;
}> => {
    const tokenEndpoint = `${issuerUrl}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: keycloakClientId,
        client_secret: keycloakClientSecret,
        username: emailId,
        scope: 'openid',
    });

    const response = await axios.post(tokenEndpoint, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token, id_token } = response.data;
    const tokenClaims = decodeJwtPayload(access_token);

    logger.info(`createKeycloakSsoSession: session created for ${emailId} via ${provider}`);

    return { access_token, refresh_token, id_token, tokenClaims };
};
