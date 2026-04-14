import { describe, it, expect } from 'vitest';
import { IDENTIFIER_REGEX, OTP_REGEX, PASSWORD_REGEX, maskIdentifier } from './ValidationUtils';

describe('auth-utils', () => {
    describe('IDENTIFIER_REGEX', () => {
        it('should validate correct email addresses', () => {
            expect(IDENTIFIER_REGEX.test('test@example.com')).toBe(true);
            expect(IDENTIFIER_REGEX.test('user.name+tag@domain.co.uk')).toBe(true);
        });

        it('should validate correct phone numbers (Indian format 6-9 leading)', () => {
            expect(IDENTIFIER_REGEX.test('9876543210')).toBe(true);
            expect(IDENTIFIER_REGEX.test('6000000000')).toBe(true);
        });

        it('should invalidate incorrect email addresses', () => {
            expect(IDENTIFIER_REGEX.test('invalid-email')).toBe(false);
            expect(IDENTIFIER_REGEX.test('test@domain')).toBe(false);
            expect(IDENTIFIER_REGEX.test('@domain.com')).toBe(false);
        });

        it('should invalidate incorrect phone numbers', () => {
            expect(IDENTIFIER_REGEX.test('1234567890')).toBe(false); // Starts with 1
            expect(IDENTIFIER_REGEX.test('987654321')).toBe(false);  // Too short
            expect(IDENTIFIER_REGEX.test('98765432100')).toBe(false); // Too long
        });
    });

    describe('OTP_REGEX', () => {
        it('should validate 6-digit OTPs', () => {
            expect(OTP_REGEX.test('123456')).toBe(true);
            expect(OTP_REGEX.test('000000')).toBe(true);
        });

        it('should invalidate non-6-digit OTPs', () => {
            expect(OTP_REGEX.test('12345')).toBe(false);
            expect(OTP_REGEX.test('1234567')).toBe(false);
            expect(OTP_REGEX.test('abcdef')).toBe(false);
        });
    });

    describe('PASSWORD_REGEX', () => {
        it('should validate strong passwords', () => {
            expect(PASSWORD_REGEX.test('StrongPass123!')).toBe(true);
            expect(PASSWORD_REGEX.test('vAlid#P4ss')).toBe(true);
        });

        it('should invalidate weak passwords', () => {
            expect(PASSWORD_REGEX.test('weak')).toBe(false); // Too short
            expect(PASSWORD_REGEX.test('lowercase123!')).toBe(false); // No uppercase
            expect(PASSWORD_REGEX.test('UPPERCASE123!')).toBe(false); // No lowercase
            expect(PASSWORD_REGEX.test('NoSpecialChar123')).toBe(false); // No special char
            expect(PASSWORD_REGEX.test('OnlyLetters!#')).toBe(false); // No digits
        });
    });

    describe('maskIdentifier', () => {
        it('should mask email addresses correctly', () => {
            expect(maskIdentifier('testuser@gmail.com')).toBe('te***@gmail.com');
            expect(maskIdentifier('ab@example.com')).toBe('ab***@example.com');
        });

        it('should mask phone numbers correctly', () => {
            expect(maskIdentifier('9876543210')).toBe('98******10');
            expect(maskIdentifier('6001122334')).toBe('60******34');
        });

        it('should return original value if email local part or domain is missing', () => {
            // This case is unlikely given regex but good for branch coverage
            expect(maskIdentifier('@domain.com')).toBe('@domain.com');
        });
    });
});
