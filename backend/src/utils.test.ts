import { describe, it, expect } from 'vitest';

// Sample utility functions to test
export const sum = (a: number, b: number): number => {
  return a + b;
};


describe('Utility Functions', () => {
  describe('sum', () => {
    it('should add two positive numbers correctly', () => {
      expect(sum(2, 3)).toBe(5);
    });

    it('should add negative numbers correctly', () => {
      expect(sum(-2, -3)).toBe(-5);
    });

    it('should add zero correctly', () => {
      expect(sum(5, 0)).toBe(5);
    });
  });
});