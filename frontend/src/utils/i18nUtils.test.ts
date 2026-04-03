import { describe, it, expect, vi } from 'vitest';
import {
  resolveTitleText,
  resolveTitleTextWithTranslation,
  normalizeCategoryKey,
  getCategoryLabel,
} from './i18nUtils';

describe('i18nUtils', () => {
  describe('resolveTitleText', () => {
    it('should return empty string for undefined title', () => {
      expect(resolveTitleText(undefined, 'en')).toBe('');
    });

    it('should return plain string as-is', () => {
      expect(resolveTitleText('Hello World', 'en')).toBe('Hello World');
    });

    it('should resolve object title for current language', () => {
      const title = { en: 'Hello', ar: 'مرحبا', fr: 'Bonjour' };
      expect(resolveTitleText(title, 'ar')).toBe('مرحبا');
    });

    it('should fallback to English when current language not available', () => {
      const title = { en: 'Hello', fr: 'Bonjour' };
      expect(resolveTitleText(title, 'ar')).toBe('Hello');
    });

    it('should fallback to first available value when neither current nor English available', () => {
      const title = { fr: 'Bonjour', de: 'Hallo' };
      expect(resolveTitleText(title, 'ar')).toBe('Bonjour');
    });

    it('should return empty string for empty object', () => {
      expect(resolveTitleText({}, 'en')).toBe('');
    });
  });

  describe('resolveTitleTextWithTranslation', () => {
    it('should return empty string for undefined title', () => {
      const mockT = vi.fn();
      expect(resolveTitleTextWithTranslation(undefined, 'en', mockT)).toBe('');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should resolve object title without calling translation', () => {
      const mockT = vi.fn();
      const title = { en: 'Hello', ar: 'مرحبا' };
      expect(resolveTitleTextWithTranslation(title, 'ar', mockT)).toBe('مرحبا');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should translate string title using i18n', () => {
      const mockT = vi.fn((key, options) => {
        if (key === 'exploreFilters.collection') return 'Collection';
        return options?.defaultValue || key;
      });
      
      expect(resolveTitleTextWithTranslation('exploreFilters.collection', 'en', mockT)).toBe('Collection');
      expect(mockT).toHaveBeenCalledWith('exploreFilters.collection', { defaultValue: 'exploreFilters.collection' });
    });

    it('should return original string when no translation exists', () => {
      const mockT = vi.fn((key, options) => options?.defaultValue || key);
      
      expect(resolveTitleTextWithTranslation('Some Label', 'en', mockT)).toBe('Some Label');
      expect(mockT).toHaveBeenCalledWith('Some Label', { defaultValue: 'Some Label' });
    });
  });

  describe('normalizeCategoryKey', () => {
    it('should convert to lowercase', () => {
      expect(normalizeCategoryKey('Course')).toBe('course');
    });

    it('should remove spaces', () => {
      expect(normalizeCategoryKey('Digital Textbook')).toBe('digitaltextbook');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeCategoryKey('Learning   Resource')).toBe('learningresource');
    });

    it('should handle already normalized strings', () => {
      expect(normalizeCategoryKey('course')).toBe('course');
    });
  });

  describe('getCategoryLabel', () => {
    it('should return fallback for undefined category', () => {
      const mockT = vi.fn();
      expect(getCategoryLabel(undefined, mockT, 'Default')).toBe('Default');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should return empty string for undefined category without fallback', () => {
      const mockT = vi.fn();
      expect(getCategoryLabel(undefined, mockT)).toBe('');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should translate category using contentTypes namespace', () => {
      const mockT = vi.fn((key, options) => {
        if (key === 'contentTypes.course') return 'Course';
        return options?.defaultValue || key;
      });
      
      expect(getCategoryLabel('Course', mockT)).toBe('Course');
      expect(mockT).toHaveBeenCalledWith('contentTypes.course', { defaultValue: 'Course' });
    });

    it('should normalize category key before translation', () => {
      const mockT = vi.fn((key, options) => {
        if (key === 'contentTypes.digitaltextbook') return 'Digital Textbook';
        return options?.defaultValue || key;
      });
      
      expect(getCategoryLabel('Digital Textbook', mockT)).toBe('Digital Textbook');
      expect(mockT).toHaveBeenCalledWith('contentTypes.digitaltextbook', { defaultValue: 'Digital Textbook' });
    });

    it('should return original value when no translation exists', () => {
      const mockT = vi.fn((key, options) => options?.defaultValue || key);
      
      expect(getCategoryLabel('Custom Type', mockT)).toBe('Custom Type');
      expect(mockT).toHaveBeenCalledWith('contentTypes.customtype', { defaultValue: 'Custom Type' });
    });
  });
});
