import { envConfig } from '../config/env.js';
import { ssoProviders } from '../services/ssoProviders.js';
import logger from '../utils/logger.js';

let validatedSsoProviders: string[] | null = null;

/**
 * Validates envConfig.ENABLED_SSO_PROVIDERS against the ssoProviders registry,
 * dropping (and logging) any unregistered provider name, and falling back to
 * ['google'] if nothing valid remains. Memoized — call once at startup, reuse
 * the result for route gating and appInfoController.
 */
export const validateSsoConfig = (): string[] => {
    if (validatedSsoProviders) {
        return validatedSsoProviders;
    }

    const registered = Object.keys(ssoProviders);
    const valid = envConfig.ENABLED_SSO_PROVIDERS.filter(provider => {
        if (!registered.includes(provider)) {
            logger.error(`Unknown SSO provider "${provider}" in ENABLED_SSO_PROVIDERS — dropping`);
            return false;
        }
        return true;
    });

    validatedSsoProviders = valid.length > 0 ? valid : ['google'];
    return validatedSsoProviders;
};
