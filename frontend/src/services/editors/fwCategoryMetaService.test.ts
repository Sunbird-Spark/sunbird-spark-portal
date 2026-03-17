import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrameworkRead = vi.hoisted(() => vi.fn());

vi.mock('../FrameworkService', () => ({
  FrameworkService: class {
    read = mockFrameworkRead;
  },
}));

import { fetchFwCategoryMeta } from './fwCategoryMetaService';

describe('fetchFwCategoryMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty defaults when framework is undefined', async () => {
    const result = await fetchFwCategoryMeta(undefined);

    expect(result).toEqual({ contentFields: '', fwCategoryDetails: [] });
    expect(mockFrameworkRead).not.toHaveBeenCalled();
  });

  it('should return empty defaults when framework is empty string', async () => {
    const result = await fetchFwCategoryMeta('');

    expect(result).toEqual({ contentFields: '', fwCategoryDetails: [] });
    expect(mockFrameworkRead).not.toHaveBeenCalled();
  });

  it('should fetch and map framework categories correctly', async () => {
    mockFrameworkRead.mockResolvedValue({
      data: {
        framework: {
          categories: [
            { code: 'board', name: 'Board', identifier: 'cat-1' },
            { code: 'medium', name: 'Medium', identifier: 'cat-2' },
            { code: 'gradeLevel', name: 'Grade Level', identifier: 'cat-3' },
          ],
        },
      },
    });

    const result = await fetchFwCategoryMeta('fw-test');

    expect(mockFrameworkRead).toHaveBeenCalledWith('fw-test');
    expect(result.fwCategoryDetails).toEqual([
      { code: 'board', label: 'Board' },
      { code: 'medium', label: 'Medium' },
      { code: 'gradeLevel', label: 'Grade Level' },
    ]);
    expect(result.contentFields).toBe('board,medium,gradeLevel');
  });

  it('should return empty defaults when categories is not an array', async () => {
    mockFrameworkRead.mockResolvedValue({
      data: { framework: { categories: null } },
    });

    const result = await fetchFwCategoryMeta('fw-test');

    expect(result).toEqual({ contentFields: '', fwCategoryDetails: [] });
  });

  it('should return empty defaults when framework response has no categories key', async () => {
    mockFrameworkRead.mockResolvedValue({
      data: { framework: {} },
    });

    const result = await fetchFwCategoryMeta('fw-test');

    expect(result).toEqual({ contentFields: '', fwCategoryDetails: [] });
  });

  it('should return empty defaults when API call fails', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFrameworkRead.mockRejectedValue(new Error('Network error'));

    const result = await fetchFwCategoryMeta('fw-test');

    expect(result).toEqual({ contentFields: '', fwCategoryDetails: [] });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch framework categories:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('should handle a single category', async () => {
    mockFrameworkRead.mockResolvedValue({
      data: {
        framework: {
          categories: [{ code: 'subject', name: 'Subject', identifier: 'cat-1' }],
        },
      },
    });

    const result = await fetchFwCategoryMeta('fw-single');

    expect(result.fwCategoryDetails).toEqual([
      { code: 'subject', label: 'Subject' },
    ]);
    expect(result.contentFields).toBe('subject');
  });

  it('should handle empty categories array', async () => {
    mockFrameworkRead.mockResolvedValue({
      data: { framework: { categories: [] } },
    });

    const result = await fetchFwCategoryMeta('fw-empty');

    expect(result.fwCategoryDetails).toEqual([]);
    expect(result.contentFields).toBe('');
  });
});
