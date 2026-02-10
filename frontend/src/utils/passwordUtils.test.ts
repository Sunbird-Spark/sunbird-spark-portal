import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './passwordUtils';

describe('Password Utils', () => {
    describe('hashPassword', () => {
        it('should hash password using bcrypt', async () => {
            const password = 'TestPass123!';
            const hashed = await hashPassword(password);
            
            // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
            expect(hashed).toBeTruthy();
            expect(hashed.length).toBe(60);
            expect(/^\$2[aby]\$\d{2}\$/.test(hashed)).toBe(true);
        });

        it('should produce different hashes for same password (due to salt)', async () => {
            const password = 'TestPass123!';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);
            
            // Bcrypt uses random salt, so hashes will be different
            expect(hash1).not.toBe(hash2);
            
            // But both should verify correctly
            expect(await verifyPassword(password, hash1)).toBe(true);
            expect(await verifyPassword(password, hash2)).toBe(true);
        });

        it('should handle special characters', async () => {
            const password = 'P@ssw0rd!#$%^&*()';
            const hashed = await hashPassword(password);
            
            expect(await verifyPassword(password, hashed)).toBe(true);
        });

        it('should handle long passwords', async () => {
            const password = 'ThisIsAVeryLongPasswordWithMoreThan50Characters1234567890!@#$%';
            const hashed = await hashPassword(password);
            
            expect(await verifyPassword(password, hashed)).toBe(true);
        });
    });

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'TestPass123!';
            const hashed = await hashPassword(password);
            
            const isValid = await verifyPassword(password, hashed);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'TestPass123!';
            const wrongPassword = 'WrongPass456!';
            const hashed = await hashPassword(password);
            
            const isValid = await verifyPassword(wrongPassword, hashed);
            expect(isValid).toBe(false);
        });

        it('should be case sensitive', async () => {
            const password = 'TestPass123!';
            const hashed = await hashPassword(password);
            
            const isValid = await verifyPassword('testpass123!', hashed);
            expect(isValid).toBe(false);
        });
    });
});
