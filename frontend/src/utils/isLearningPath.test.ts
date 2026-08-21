import { describe, it, expect } from 'vitest';
import { isLearningPathCategory } from './isLearningPath';

describe('isLearningPathCategory', () => {
  it('matches "Learning Path" case-insensitively', () => {
    expect(isLearningPathCategory('Learning Path')).toBe(true);
    expect(isLearningPathCategory('learning path')).toBe(true);
    expect(isLearningPathCategory('LEARNING PATH')).toBe(true);
  });

  it('returns false for other categories', () => {
    expect(isLearningPathCategory('Course')).toBe(false);
    expect(isLearningPathCategory('Collection')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isLearningPathCategory(undefined)).toBe(false);
  });
});
