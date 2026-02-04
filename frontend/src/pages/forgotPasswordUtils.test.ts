import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildValidIdentifiers, redirectWithError } from './forgotPasswordUtils';

describe('forgotPasswordUtils', () => {
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
    });

    describe('redirectWithError', () => {
        const originalLocation = window.location;

        beforeEach(() => {
            const mockLocation = new URL('http://test.com/forgot-password?error_callback=http://test.com/login');
            // @ts-ignore
            delete (window as any).location;
            window.location = mockLocation as any;
        });

        afterEach(() => {
            window.location = originalLocation;
        });

        it('should redirect with error_message if error_callback exists', () => {
            redirectWithError('Test error message');

            const expectedUrl = 'http://test.com/login?error_callback=http%3A%2F%2Ftest.com%2Flogin&error_message=Test+error+message';
            expect(window.location.href).toBe(expectedUrl);
        });

        it('should not redirect if error_callback does not exist', () => {
            window.location.search = '';
            const initialHref = window.location.href;

            redirectWithError('Test error message');

            expect(window.location.href).toBe(initialHref);
        });
    });
});
