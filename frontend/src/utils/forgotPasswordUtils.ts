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
    if (redirectUri && isSafeUrl(redirectUri)) {
        return redirectUri;
    }
    if (redirectUri) {
        console.warn('getSafeRedirectUrl: invalid redirect_uri, ignoring');
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
    return new URLSearchParams(window.location.search).get('client') === 'mobileApp';
};

export const appendMobileParams = (link: string): string => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');
    const client = params.get('client');
    try {
        const linkUrl = new URL(link, window.location.origin);
        if (redirectUri && isSafeUrl(redirectUri)) {
            linkUrl.searchParams.set('redirect_uri', redirectUri);
        }
        if (client) {
            linkUrl.searchParams.set('client', client);
        }
        return linkUrl.toString();
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
