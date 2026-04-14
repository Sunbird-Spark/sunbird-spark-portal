import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildValidIdentifiers, redirectWithError, isMobileApp, getSafeRedirectUrl, appendMobileParams, persistMobileContext, clearMobileContext } from './forgotPasswordUtils';

describe('forgotPasswordUtils', () => {
    describe('persistMobileContext', () => {
        beforeEach(() => {
            sessionStorage.clear();
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            sessionStorage.clear();
        });

        it('should persist mobile context to sessionStorage when client=mobileApp', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=https://example.com/callback',
            });

            persistMobileContext();

            const stored = sessionStorage.getItem('sunbird_mobile_context');
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!)).toEqual({
                client: 'mobileApp',
                redirectUri: 'https://example.com/callback'
            });
        });

        it('should not persist when client is not mobileApp', () => {
            vi.stubGlobal('location', {
                search: '?client=web&redirect_uri=https://example.com/callback',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should not persist when redirect_uri is missing', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should not persist when both params are missing', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should handle custom app scheme redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=org.sunbird.app://oauth2callback',
            });

            persistMobileContext();

            const stored = sessionStorage.getItem('sunbird_mobile_context');
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!)).toEqual({
                client: 'mobileApp',
                redirectUri: 'org.sunbird.app://oauth2callback'
            });
        });

        // Security tests
        it('should NOT persist javascript: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=javascript:alert(1)',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should NOT persist data: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=data:text/html,<script>alert(1)</script>',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should NOT persist tel: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=tel://1234567890',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should NOT persist file: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=file:///etc/passwd',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should NOT persist blob: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=blob:https://example.com/abc-123',
            });

            persistMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should persist http: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=http://localhost:3000/callback',
            });

            persistMobileContext();

            const stored = sessionStorage.getItem('sunbird_mobile_context');
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!).redirectUri).toBe('http://localhost:3000/callback');
        });

        it('should persist https: protocol redirect_uri', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=https://example.com/callback',
            });

            persistMobileContext();

            const stored = sessionStorage.getItem('sunbird_mobile_context');
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!).redirectUri).toBe('https://example.com/callback');
        });
    });

    describe('clearMobileContext', () => {
        beforeEach(() => {
            sessionStorage.clear();
        });

        afterEach(() => {
            sessionStorage.clear();
        });

        it('should clear mobile context from sessionStorage', () => {
            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'mobileApp',
                redirectUri: 'https://example.com/callback'
            }));

            clearMobileContext();

            expect(sessionStorage.getItem('sunbird_mobile_context')).toBeNull();
        });

        it('should not throw when sessionStorage is empty', () => {
            expect(() => clearMobileContext()).not.toThrow();
        });
    });

    describe('buildValidIdentifiers', () => {
        it('should return empty list when no users are provided', () => {
            expect(buildValidIdentifiers([])).toEqual([]);
        });

        it('should extract valid identifiers from user results', () => {
            const users = [
                {
                    id: 'user1',
                    phone: '9876543210',
                    email: 'user1@example.com',
                },
                {
                    id: 'user2',
                    recoveryEmail: 'recovery@example.com',
                    prevUsedPhone: '1234567890'
                }
            ];

            const result = buildValidIdentifiers(users);

            expect(result).toHaveLength(4);
            expect(result).toContainEqual({ id: 'user1', type: 'phone', value: '9876543210' });
            expect(result).toContainEqual({ id: 'user1', type: 'email', value: 'user1@example.com' });
            expect(result).toContainEqual({ id: 'user2', type: 'recoveryEmail', value: 'recovery@example.com' });
            expect(result).toContainEqual({ id: 'user2', type: 'prevUsedPhone', value: '1234567890' });
        });

        it('should handle all possible keys correctly', () => {
            const user = {
                id: 'id',
                phone: 'p',
                email: 'e',
                prevUsedEmail: 'pe',
                prevUsedPhone: 'pp',
                recoveryEmail: 're',
                recoveryPhone: 'rp'
            };

            const result = buildValidIdentifiers([user]);

            expect(result).toHaveLength(6);
            const types = result.map(r => r.type);
            expect(types).toContain('phone');
            expect(types).toContain('email');
            expect(types).toContain('prevUsedEmail');
            expect(types).toContain('prevUsedPhone');
            expect(types).toContain('recoveryEmail');
            expect(types).toContain('recoveryPhone');
        });

        it('should skip users without an id', () => {
            const users = [
                {
                    phone: '9876543210',
                    email: 'user@example.com'
                }
            ];

            const result = buildValidIdentifiers(users);

            expect(result).toHaveLength(0);
        });
    });

    describe('redirectWithError', () => {
        beforeEach(() => {
            vi.stubGlobal('location', {
                href: 'http://test.com/forgot-password?error_callback=http://test.com/login',
                search: '?error_callback=http://test.com/login',
                assign: vi.fn(),
                replace: vi.fn(),
            });
        });

        it('should redirect and return true if error_callback exists', () => {
            const result = redirectWithError('Test error message');
            expect(result).toBe(true);

            const expectedUrl = 'http://test.com/login?error_callback=http%3A%2F%2Ftest.com%2Flogin&error_message=Test+error+message';
            expect(window.location.href).toBe(expectedUrl);
        });

        it('should not redirect and return false if error_callback does not exist', () => {
            vi.stubGlobal('location', {
                href: 'http://test.com/forgot-password',
                search: '',
                assign: vi.fn(),
                replace: vi.fn(),
            });
            const initialHref = window.location.href;

            const result = redirectWithError('Test error message');
            expect(result).toBe(false);

            expect(window.location.href).toBe(initialHref);
        });
    });

    describe('isMobileApp', () => {
        beforeEach(() => {
            // Clear sessionStorage before each test
            sessionStorage.clear();
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            sessionStorage.clear();
        });

        it('should return true when client=mobileApp is in URL', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp&redirect_uri=https://example.com/callback',
            });

            expect(isMobileApp()).toBe(true);
        });

        it('should return false when client param is not mobileApp', () => {
            vi.stubGlobal('location', {
                search: '?client=web',
            });

            expect(isMobileApp()).toBe(false);
        });

        it('should return false when client param is missing', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/callback',
            });

            expect(isMobileApp()).toBe(false);
        });

        it('should return false when URL has no query params', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            expect(isMobileApp()).toBe(false);
        });

        it('should return true when client is in sessionStorage (fallback after redirect)', () => {
            vi.stubGlobal('location', {
                search: '', // No URL params (simulates Keycloak redirect)
            });

            // Simulate persisted mobile context
            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'mobileApp',
                redirectUri: 'https://example.com/callback'
            }));

            expect(isMobileApp()).toBe(true);
        });

        it('should return false when sessionStorage has different client', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'web',
                redirectUri: 'https://example.com/callback'
            }));

            expect(isMobileApp()).toBe(false);
        });

        it('should prioritize URL param over sessionStorage', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp',
            });

            // Different value in sessionStorage
            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'web',
                redirectUri: 'https://example.com/callback'
            }));

            expect(isMobileApp()).toBe(true);
        });
    });

    describe('getSafeRedirectUrl', () => {
        beforeEach(() => {
            // Clear sessionStorage before each test
            sessionStorage.clear();
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            sessionStorage.clear();
        });

        it('should return redirect_uri when it is a valid HTTPS URL', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/oauth2callback',
            });

            expect(getSafeRedirectUrl()).toBe('https://example.com/oauth2callback');
        });

        it('should return redirect_uri when it is a valid HTTP URL', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=http://localhost:3000/callback',
            });

            expect(getSafeRedirectUrl()).toBe('http://localhost:3000/callback');
        });

        it('should return fallback when redirect_uri is missing', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp',
            });

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });

        it('should return custom fallback when provided', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            expect(getSafeRedirectUrl('/custom/fallback')).toBe('/custom/fallback');
        });

        it('should return fallback when redirect_uri is not a valid URL', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=javascript:alert(1)',
            });

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });

        it('should return fallback when redirect_uri uses blocked protocol', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=javascript:alert(1)',
            });

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });

        it('should convert custom app scheme redirect_uri to intent URL when client=mobileApp', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=org.sunbird.app://oauth2callback&client=mobileApp',
            });

            expect(getSafeRedirectUrl()).toBe('intent://oauth2callback#Intent;scheme=org.sunbird.app;package=org.sunbird.app;end');
        });

        it('should reject custom app scheme redirect_uri without client=mobileApp', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=org.sunbird.app://oauth2callback',
            });

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });

        it('should return http/https redirect_uri as-is', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/oauth2callback',
            });

            expect(getSafeRedirectUrl()).toBe('https://example.com/oauth2callback');
        });

        // SessionStorage fallback tests (critical for Keycloak redirect chain)
        it('should return redirect_uri from sessionStorage when URL param is missing', () => {
            vi.stubGlobal('location', {
                search: '', // No URL params (simulates Keycloak redirect)
            });

            // Simulate persisted mobile context
            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'mobileApp',
                redirectUri: 'https://example.com/oauth2callback'
            }));

            expect(getSafeRedirectUrl()).toBe('https://example.com/oauth2callback');
        });

        it('should convert custom app scheme from sessionStorage to intent URL', () => {
            vi.stubGlobal('location', {
                search: '', // No URL params
            });

            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'mobileApp',
                redirectUri: 'org.sunbird.app://oauth2callback'
            }));

            expect(getSafeRedirectUrl()).toBe('intent://oauth2callback#Intent;scheme=org.sunbird.app;package=org.sunbird.app;end');
        });

        it('should prioritize URL param over sessionStorage', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://url-param.com/callback',
            });

            // Different value in sessionStorage
            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'mobileApp',
                redirectUri: 'https://session-storage.com/callback'
            }));

            expect(getSafeRedirectUrl()).toBe('https://url-param.com/callback');
        });

        it('should return fallback when sessionStorage redirect_uri is invalid', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            sessionStorage.setItem('sunbird_mobile_context', JSON.stringify({
                client: 'mobileApp',
                redirectUri: 'javascript:alert(1)'
            }));

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });

        it('should return fallback when sessionStorage is empty', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });

        it('should handle malformed JSON in sessionStorage gracefully', () => {
            vi.stubGlobal('location', {
                search: '',
            });

            sessionStorage.setItem('sunbird_mobile_context', 'invalid-json{');

            expect(getSafeRedirectUrl()).toBe('/portal/login?prompt=none');
        });
    });

    describe('appendMobileParams', () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('should append both redirect_uri and client params to absolute URL', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/callback&client=mobileApp',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('https://portal.example.com/password-reset-success');

            expect(result).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
            expect(result).toContain('client=mobileApp');
            expect(result).toBe('https://portal.example.com/password-reset-success?redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&client=mobileApp');
        });

        it('should append both redirect_uri and client params to relative URL', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/callback&client=mobileApp',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('/password-reset-success');

            expect(result).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
            expect(result).toContain('client=mobileApp');
            expect(result).toBe('https://portal.example.com/password-reset-success?redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&client=mobileApp');
        });

        it('should only append client param when redirect_uri is missing', () => {
            vi.stubGlobal('location', {
                search: '?client=mobileApp',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('/password-reset-success');

            expect(result).not.toContain('redirect_uri');
            expect(result).toContain('client=mobileApp');
            expect(result).toBe('https://portal.example.com/password-reset-success?client=mobileApp');
        });

        it('should only append redirect_uri when client is missing', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/callback',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('/password-reset-success');

            expect(result).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
            expect(result).not.toContain('client');
            expect(result).toBe('https://portal.example.com/password-reset-success?redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
        });

        it('should return original link when no params to append', () => {
            vi.stubGlobal('location', {
                search: '',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('/password-reset-success');

            expect(result).toBe('https://portal.example.com/password-reset-success');
        });

        it('should not append redirect_uri when it is invalid', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=javascript:alert(1)&client=mobileApp',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('/password-reset-success');

            expect(result).not.toContain('redirect_uri');
            expect(result).toContain('client=mobileApp');
        });

        it('should preserve existing query params in the link', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/callback&client=mobileApp',
                origin: 'https://portal.example.com',
            });

            const result = appendMobileParams('/password-reset-success?foo=bar');

            expect(result).toContain('foo=bar');
            expect(result).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
            expect(result).toContain('client=mobileApp');
        });

        it('should return original link on error', () => {
            vi.stubGlobal('location', {
                search: '?redirect_uri=https://example.com/callback&client=mobileApp',
                origin: undefined, // This will cause URL constructor to fail
            });

            const result = appendMobileParams('/password-reset-success');

            // Should return original link when error occurs
            expect(result).toBe('/password-reset-success');
        });
    });
});
