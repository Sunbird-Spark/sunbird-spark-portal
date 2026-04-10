import { describe, it, expect } from 'vitest';
import { SignupService } from './SignupService';

describe('SignupService', () => {
  const service = new SignupService();

  describe('validateFirstName (line 16)', () => {
    it('returns valid when firstName has content', () => {
      expect(service.validateFirstName('Alice').isValid).toBe(true);
    });

    it('returns error when firstName is empty (line 16 true branch)', () => {
      const result = service.validateFirstName('');
      expect(result.isValid).toBe(false);
      expect(result.error?.title).toBe('First Name Required');
    });

    it('returns error when firstName is whitespace only (trimmed to empty)', () => {
      const result = service.validateFirstName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error?.title).toBe('First Name Required');
    });
  });

  describe('validateIdentifier', () => {
    it('returns valid for a proper email', () => {
      expect(service.validateIdentifier('test@example.com').isValid).toBe(true);
    });

    it('returns valid for a 10-digit mobile starting with 9', () => {
      expect(service.validateIdentifier('9876543210').isValid).toBe(true);
    });

    it('returns error for an invalid identifier', () => {
      const result = service.validateIdentifier('bad-input');
      expect(result.isValid).toBe(false);
      expect(result.error?.title).toBe('Invalid Email or Mobile');
    });
  });

  describe('validatePassword', () => {
    it('returns valid for a strong password', () => {
      expect(service.validatePassword('Abc@1234').isValid).toBe(true);
    });

    it('returns error for a weak password', () => {
      const result = service.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.error?.title).toBe('Weak Password');
    });
  });

  describe('validatePasswordMatch', () => {
    it('returns valid when passwords match', () => {
      expect(service.validatePasswordMatch('Abc@1234', 'Abc@1234').isValid).toBe(true);
    });

    it('returns error when passwords differ', () => {
      const result = service.validatePasswordMatch('Abc@1234', 'Different1@');
      expect(result.isValid).toBe(false);
      expect(result.error?.title).toBe('Passwords Mismatch');
    });
  });

  describe('validateSignupForm', () => {
    it('returns first error when multiple validations fail', () => {
      const result = service.validateSignupForm('', '', '', '');
      expect(result.isValid).toBe(false);
    });

    it('returns valid when all fields are correct', () => {
      const result = service.validateSignupForm('Alice', 'test@example.com', 'Abc@1234', 'Abc@1234');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getIdentifierType (line 68)', () => {
    it('returns "email" when identifier contains @', () => {
      expect(service.getIdentifierType('user@example.com')).toBe('email');
    });

    it('returns "phone" when identifier has no @ (line 68 false branch)', () => {
      expect(service.getIdentifierType('9876543210')).toBe('phone');
    });
  });

  describe('createOtpGenerationRequest', () => {
    it('sets type to email for email identifier', () => {
      const req = service.createOtpGenerationRequest('user@example.com');
      expect(req.request.type).toBe('email');
    });

    it('sets type to phone for phone identifier', () => {
      const req = service.createOtpGenerationRequest('9876543210');
      expect(req.request.type).toBe('phone');
    });
  });

  describe('encodePassword', () => {
    it('returns a base64 string', () => {
      const encoded = service.encodePassword('MyPassword1!');
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });
  });
});
