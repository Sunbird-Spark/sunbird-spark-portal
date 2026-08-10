import { randomUUID } from 'crypto';

export const CSRF_COOKIE_NAME = 'csrfToken';

export function generateCsrfToken(): string {
    return randomUUID();
}

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) return undefined;
    const match = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
