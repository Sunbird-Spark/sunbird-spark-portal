import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
