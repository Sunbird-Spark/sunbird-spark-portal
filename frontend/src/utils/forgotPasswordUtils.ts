import { OtpIdentifier, IdentifierType } from '../types/forgotPasswordTypes';

const DEFAULT_LOGIN_URL = '/portal/login?prompt=none';
const MOBILE_CONTEXT_KEY = 'sunbird_mobile_context';

interface MobileContext {
    client: string;
    redirectUri: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

const isSafeUrl = (url: string, allowedAppScheme?: string): boolean => {
    try {
        const parsed = new URL(url);
        if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
            return true;
        }
        // Allow the specific app scheme if provided (e.g., 'org.sunbird.app:')
        if (allowedAppScheme && parsed.protocol === allowedAppScheme) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

/**
 * Extracts the app scheme from the redirect_uri to use as an allowed protocol.
 * Only allowed when client=mobileApp is present (trusted mobile context).
 * e.g., 'org.sunbird.app://mobileApp' → 'org.sunbird.app:'
 */
const getAppSchemeFromRedirectUri = (): string | undefined => {
    try {
        const params = new URLSearchParams(window.location.search);
        // Only trust custom schemes when the request comes from the mobile app
        if (params.get('client') !== 'mobileApp') return undefined;
        const redirectUri = params.get('redirect_uri');
        if (!redirectUri) return undefined;
        const parsed = new URL(redirectUri);
        // App ID schemes contain dots (e.g., org.sunbird.app:)
        // This rejects single-word protocols like javascript:, data:, blob:
        if (!ALLOWED_PROTOCOLS.includes(parsed.protocol) && parsed.protocol.includes('.')) {
            return parsed.protocol;
        }
    } catch {
        // invalid URL
    }
    return undefined;
};

/**
 * Persists mobile context (client + redirect_uri) to sessionStorage.
 * Called when auth pages load with client=mobileApp so the context
 * survives external redirects (e.g., Keycloak password reset flow).
 * 
 * SECURITY: Validates redirect_uri before persisting to prevent storing
 * malicious URLs (e.g., tel://, javascript:, etc.).
 */
export const persistMobileContext = (): void => {
    const params = new URLSearchParams(window.location.search);
    const client = params.get('client');
    const redirectUri = params.get('redirect_uri');
    
    // Only persist if client is mobileApp and redirect_uri is present and valid
    if (client === 'mobileApp' && redirectUri) {
        // Validate redirect_uri using the same security logic as getSafeRedirectUrl
        const appScheme = getAppSchemeFromRedirectUri();
        if (!isSafeUrl(redirectUri, appScheme)) {
            console.warn('persistMobileContext: invalid redirect_uri, not persisting', redirectUri);
            return;
        }
        
        try {
            sessionStorage.setItem(MOBILE_CONTEXT_KEY, JSON.stringify({ client, redirectUri }));
        } catch (error) {
            console.warn('persistMobileContext: failed to save to sessionStorage', error);
        }
    }
};

/**
 * Retrieves persisted mobile context from sessionStorage.
 */
const getMobileContext = (): MobileContext | null => {
    try {
        const stored = sessionStorage.getItem(MOBILE_CONTEXT_KEY);
        if (stored) {
            return JSON.parse(stored) as MobileContext;
        }
    } catch (error) {
        console.warn('getMobileContext: failed to read from sessionStorage', error);
    }
    return null;
};

/**
 * Clears persisted mobile context from sessionStorage.
 */
export const clearMobileContext = (): void => {
    try {
        sessionStorage.removeItem(MOBILE_CONTEXT_KEY);
    } catch (error) {
        console.warn('clearMobileContext: failed to clear sessionStorage', error);
    }
};

/**
 * Converts a custom scheme URL to an Android intent:// URL.
 * e.g., org.sunbird.app://oauth2callback → intent://oauth2callback#Intent;scheme=org.sunbird.app;package=org.sunbird.app;end
 * Returns the original URL for http/https URLs.
 */
const toIntentUrl = (url: string): string => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return url;
        }
        const scheme = parsed.protocol.replace(':', '');
        const path = url.substring(parsed.protocol.length + '//'.length);
        return `intent://${path}#Intent;scheme=${scheme};package=${scheme};end`;
    } catch {
        return url;
    }
};

export const getSafeRedirectUrl = (fallback = DEFAULT_LOGIN_URL): string => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    const appScheme = getAppSchemeFromRedirectUri();
    if (redirectUri && isSafeUrl(redirectUri, appScheme)) {
        return toIntentUrl(redirectUri);
    }
    if (redirectUri) {
        console.warn('getSafeRedirectUrl: invalid redirect_uri, ignoring');
    }
    // Fallback to sessionStorage (survives Keycloak redirects)
    const ctx = getMobileContext();
    if (ctx?.redirectUri && isSafeUrl(ctx.redirectUri, appScheme || ctx.redirectUri.split('://')[0] + ':')) {
        return toIntentUrl(ctx.redirectUri);
    }
    return fallback;
};


export const buildValidIdentifiers = (results: any[]): OtpIdentifier[] => {
    const keys: IdentifierType[] = [
        'phone',
        'email',
        'prevUsedEmail',
        'prevUsedPhone',
        'recoveryEmail',
        'recoveryPhone'
    ];

    const list: OtpIdentifier[] = [];

    results.forEach(user => {
        if (!user.id) return;
        keys.forEach(key => {
            if (user[key]) {
                list.push({
                    id: user.id,
                    type: key,
                    value: user[key]
                });
            }
        });
    });

    return list;
};

export const isMobileApp = (): boolean => {
    const client = new URLSearchParams(window.location.search).get('client');
    if (client === 'mobileApp') {
        return true;
    }
    // Fallback to sessionStorage (survives Keycloak redirects)
    const ctx = getMobileContext();
    return ctx?.client === 'mobileApp';
};

export const appendMobileParams = (link: string): string => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    const client = params.get('client');
    try {
        const linkUrl = new URL(link, window.location.origin);
        if (redirectUri && isSafeUrl(redirectUri, getAppSchemeFromRedirectUri())) {
            linkUrl.searchParams.set('redirect_uri', redirectUri);
        }
        if (client) {
            linkUrl.searchParams.set('client', client);
        }
        const result = linkUrl.toString();
        return result;
    } catch (e) {
        console.warn('appendMobileParams: invalid base link, ignoring', e);
    }
    return link;
};

export const redirectWithError = (message: string): boolean => {
    const params = new URLSearchParams(window.location.search);
    params.set('error_message', message);
    const errorCallback = params.get('error_callback');
    if (errorCallback && isSafeUrl(errorCallback)) {
        window.location.href = `${errorCallback}?${params.toString()}`;
        return true;
    }
    if (errorCallback) {
        console.warn('redirectWithError: invalid error_callback, ignoring');
    }
    return false;
};
