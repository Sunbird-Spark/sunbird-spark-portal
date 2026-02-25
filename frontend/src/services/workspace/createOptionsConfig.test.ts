import { describe, it, expect } from 'vitest';
import { getEditorCategories } from './createOptionsConfig';

describe('createOptionsConfig', () => {
  describe('getEditorCategories', () => {
    it('should return an array of editor categories', () => {
      const categories = getEditorCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include story option with correct title "Resource"', () => {
      const categories = getEditorCategories();
      
      const storyCategory = categories.find(category => 
        category.options.some(option => option.id === 'story')
      );
      
      expect(storyCategory).toBeDefined();
      
      const storyOption = storyCategory?.options.find(option => option.id === 'story');
      expect(storyOption).toBeDefined();
      expect(storyOption?.title).toBe('Resource');
    });

    it('should include quiz option', () => {
      const categories = getEditorCategories();
      
      const quizOption = categories
        .flatMap(category => category.options)
        .find(option => option.id === 'quiz');
      
      expect(quizOption).toBeDefined();
      expect(quizOption?.title).toBe('Quiz & Assessment');
    });

    it('should have all required properties for each category', () => {
      const categories = getEditorCategories();
      
      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('title');
        expect(category).toHaveProperty('options');
        expect(Array.isArray(category.options)).toBe(true);
        
        category.options.forEach(option => {
          expect(option).toHaveProperty('id');
          expect(option).toHaveProperty('title');
          expect(option).toHaveProperty('description');
          expect(option).toHaveProperty('icon');
          expect(option).toHaveProperty('iconBg');
          expect(option).toHaveProperty('iconColor');
        });
      });
    });

    it('should have unique option IDs across all categories', () => {
      const categories = getEditorCategories();
      const allOptionIds = categories.flatMap(category => 
        category.options.map(option => option.id)
      );
      
      const uniqueIds = new Set(allOptionIds);
      expect(uniqueIds.size).toBe(allOptionIds.length);
    });

    it('should have non-empty titles and descriptions', () => {
      const categories = getEditorCategories();
      
      categories.forEach(category => {
        expect(category.title.trim()).not.toBe('');
        
        category.options.forEach(option => {
          expect(option.title.trim()).not.toBe('');
          expect(option.description.trim()).not.toBe('');
        });
      });
    });

    it('should have valid CSS classes for iconBg and iconColor', () => {
      const categories = getEditorCategories();
      
      categories.forEach(category => {
        category.options.forEach(option => {
          // Check that iconBg starts with 'bg-' (Tailwind CSS background class)
          expect(option.iconBg).toMatch(/^bg-/);
          
          // Check that iconColor starts with 'text-' (Tailwind CSS text color class)
          expect(option.iconColor).toMatch(/^text-/);
        });
      });
    });

    it('should maintain story option description consistency', () => {
      const categories = getEditorCategories();
      
      const storyOption = categories
        .flatMap(category => category.options)
        .find(option => option.id === 'story');
      
      expect(storyOption?.description).toBe('Create learning resources like documents, presentations, and assessments.');
    });
  });
});