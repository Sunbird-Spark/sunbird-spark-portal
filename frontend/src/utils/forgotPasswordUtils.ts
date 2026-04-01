import { OtpIdentifier, IdentifierType } from '../types/forgotPasswordTypes';

const DEFAULT_LOGIN_URL = '/portal/login?prompt=none';
const MOBILE_CONTEXT_KEY = 'sunbird_mobile_context';

interface MobileContext {
    client: string;
    redirectUri: string;
}

/**
 * Persists mobile context (client + redirect_uri) to sessionStorage.
 * Called when auth pages load with client=mobileApp so the context
 * survives external redirects (e.g., Keycloak password reset flow).
 */
export const persistMobileContext = (): void => {
    const params = new URLSearchParams(window.location.search);
    const client = params.get('client');
    const redirectUri = params.get('redirect_uri');
    if (client === 'mobileApp' && redirectUri) {
        try {
            sessionStorage.setItem(MOBILE_CONTEXT_KEY, JSON.stringify({ client, redirectUri }));
        } catch {
            // sessionStorage unavailable — ignore
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
    } catch {
        // sessionStorage unavailable or invalid JSON — ignore
    }
    return null;
};

/**
 * Clears persisted mobile context from sessionStorage.
 */
export const clearMobileContext = (): void => {
    try {
        sessionStorage.removeItem(MOBILE_CONTEXT_KEY);
    } catch {
        // sessionStorage unavailable — ignore
    }
};

const isSafeUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export const getSafeRedirectUrl = (fallback = DEFAULT_LOGIN_URL): string => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    if (redirectUri && isSafeUrl(redirectUri)) {
        return redirectUri;
    }
    if (redirectUri) {
        console.warn('getSafeRedirectUrl: invalid redirect_uri, ignoring');
    }
    // Fallback to sessionStorage (survives Keycloak redirects)
    const ctx = getMobileContext();
    if (ctx?.redirectUri && isSafeUrl(ctx.redirectUri)) {
        return ctx.redirectUri;
    }
    return fallback;
};

/**
 * Handles redirect after a flow completes (signup success, password reset, etc.).
 * In mobile context: closes the InAppBrowser via window.close(), which triggers
 * the browserClosed event the mobile app already listens for.
 * On web: navigates to redirect_uri or falls back to portal login.
 */
export const handleMobileRedirect = (): void => {
    if (isMobileApp()) {
        clearMobileContext();
        // Navigate to about:blank to trigger InAppBrowser's browserPageLoaded event.
        // The mobile app detects this and closes the browser.
        // We can't use window.close() (blocked: window not opened by script)
        // or navigate to redirect_uri (server intercepts it, shows "OK" page).
        window.location.href = 'about:blank';
    } else {
        window.location.href = getSafeRedirectUrl();
    }
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
    console.log('[appendMobileParams] Input link:', link);
    console.log('[appendMobileParams] Current URL:', window.location.href);
    console.log('[appendMobileParams] redirect_uri param:', redirectUri);
    console.log('[appendMobileParams] client param:', client);
    try {
        const linkUrl = new URL(link, window.location.origin);
        console.log('[appendMobileParams] Parsed link URL:', linkUrl.toString());
        if (redirectUri && isSafeUrl(redirectUri)) {
            linkUrl.searchParams.set('redirect_uri', redirectUri);
            console.log('[appendMobileParams] Added redirect_uri to link');
        }
        if (client) {
            linkUrl.searchParams.set('client', client);
            console.log('[appendMobileParams] Added client to link');
        }
        const result = linkUrl.toString();
        console.log('[appendMobileParams] Result:', result);
        return result;
    } catch (e) {
        console.warn('appendMobileParams: invalid base link, ignoring', e);
    }
    console.log('[appendMobileParams] Returning original link due to error');
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
