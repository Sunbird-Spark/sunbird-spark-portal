import { describe, it, expect } from 'vitest';
import { getContentDetailPath } from './getContentDetailPath';

describe('getContentDetailPath', () => {
  it('routes a Learning Path to /learning-path/:id', () => {
    expect(getContentDetailPath('do_lp', 'Learning Path')).toBe('/learning-path/do_lp');
  });

  it('routes a Learning Path with a batchId to /learning-path/:id/batch/:batchId', () => {
    expect(getContentDetailPath('do_lp', 'Learning Path', 'batch_1')).toBe('/learning-path/do_lp/batch/batch_1');
  });

  it('is case-insensitive on primaryCategory', () => {
    expect(getContentDetailPath('do_lp', 'learning path')).toBe('/learning-path/do_lp');
  });

  it('routes a Course to /collection/:id', () => {
    expect(getContentDetailPath('do_course', 'Course')).toBe('/collection/do_course');
  });

  it('routes a Course with a batchId to /collection/:id/batch/:batchId', () => {
    expect(getContentDetailPath('do_course', 'Course', 'batch_1')).toBe('/collection/do_course/batch/batch_1');
  });

  it('defaults to /collection/:id when primaryCategory is missing', () => {
    expect(getContentDetailPath('do_x', undefined)).toBe('/collection/do_x');
  });
});
