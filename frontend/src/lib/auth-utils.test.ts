import { describe, it, expect } from 'vitest';
import { IDENTIFIER_REGEX, OTP_REGEX, PASSWORD_REGEX, maskIdentifier } from './auth-utils';

describe('auth-utils', () => {
    describe('IDENTIFIER_REGEX', () => {
        it('validates mobile numbers correctly', () => {
            expect(IDENTIFIER_REGEX.test('9876543210')).toBe(true);
            expect(IDENTIFIER_REGEX.test('5876543210')).toBe(false);
            expect(IDENTIFIER_REGEX.test('987654321')).toBe(false);
        });

        it('validates emails correctly', () => {
            expect(IDENTIFIER_REGEX.test('test@example.com')).toBe(true);
            expect(IDENTIFIER_REGEX.test('test@example')).toBe(false);
            expect(IDENTIFIER_REGEX.test('test.example.com')).toBe(false);
        });
    });

    describe('OTP_REGEX', () => {
        it('validates 6-digit OTPs', () => {
            expect(OTP_REGEX.test('123456')).toBe(true);
            expect(OTP_REGEX.test('12345')).toBe(false);
            expect(OTP_REGEX.test('1234567')).toBe(false);
            expect(OTP_REGEX.test('abcdef')).toBe(false);
        });
    });

    describe('PASSWORD_REGEX', () => {
        it('validates passwords correctly', () => {
            expect(PASSWORD_REGEX.test('Pass123!')).toBe(true);
            expect(PASSWORD_REGEX.test('password')).toBe(false);
            expect(PASSWORD_REGEX.test('PASS123!')).toBe(false);
            expect(PASSWORD_REGEX.test('Pass123')).toBe(false);
        });
    });

    describe('maskIdentifier', () => {
        it('masks email addresses', () => {
            expect(maskIdentifier('test@example.com')).toBe('te***@example.com');
        });

        it('masks mobile numbers', () => {
            expect(maskIdentifier('9876543210')).toBe('98******10');
        });

        it('returns original value for invalid email parts', () => {
            // This tests line 13
            expect(maskIdentifier('@example.com')).toBe('@example.com');
            expect(maskIdentifier('test@')).toBe('test@');
        });
    });
});
