import { OtpIdentifier, IdentifierType } from '../types/forgotPasswordTypes';

const DEFAULT_LOGIN_URL = '/portal/login?prompt=none';

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
    console.log('[getSafeRedirectUrl] Current URL:', window.location.href);
    console.log('[getSafeRedirectUrl] redirect_uri param:', redirectUri);
    console.log('[getSafeRedirectUrl] fallback:', fallback);
    if (redirectUri && isSafeUrl(redirectUri)) {
        console.log('[getSafeRedirectUrl] Returning redirect_uri:', redirectUri);
        return redirectUri;
    }
    if (redirectUri) {
        console.warn('getSafeRedirectUrl: invalid redirect_uri, ignoring');
    }
    console.log('[getSafeRedirectUrl] Returning fallback:', fallback);
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
    const isMobile = client === 'mobileApp';
    console.log('[isMobileApp] Current URL:', window.location.href);
    console.log('[isMobileApp] client param:', client);
    console.log('[isMobileApp] Result:', isMobile);
    return isMobile;
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
