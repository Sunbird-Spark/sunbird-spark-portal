import { describe, it, expect, vi } from 'vitest';
import { slugify, buildHelpCategories, buildCategoryFaqsMap } from './HelpSupportService';
import type { ApiFaqCategory } from '../types/helpSupport';

describe('slugify', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('FAQ & Support!')).toBe('faq-support');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('handles empty string by returning original trimmed', () => {
    expect(slugify('')).toBe('');
  });

  it('falls back to trimmed name with hyphens for all-special-char input', () => {
    // All characters stripped → slug becomes empty → falls back to name.trim().replace spaces
    const result = slugify('   hello world   ');
    expect(result).toBe('hello-world');
  });

  it('handles name with only special chars', () => {
    // "!!!" → stripped to "" → fallback: "!!!".trim() => "!!!" → no spaces replaced → "!!!"
    const result = slugify('!!!');
    expect(result).toBe('!!!');
  });

  it('handles multiple consecutive special chars', () => {
    expect(slugify('foo  --  bar')).toBe('foo-bar');
  });

  it('handles numeric names', () => {
    expect(slugify('FAQ 101')).toBe('faq-101');
  });
});

describe('buildHelpCategories', () => {
  it('returns empty array for non-array input', () => {
    expect(buildHelpCategories(null as any)).toEqual([]);
    expect(buildHelpCategories(undefined as any)).toEqual([]);
    expect(buildHelpCategories('string' as any)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(buildHelpCategories([])).toEqual([]);
  });

  it('maps valid categories correctly', () => {
    const categories: ApiFaqCategory[] = [
      { id: 'cat1', name: 'General', description: 'General FAQs', faqs: [{topic: 'Q1', description: 'A1'}] },
    ];
    const result = buildHelpCategories(categories);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: 'General',
      description: 'General FAQs',
      faqCount: 1,
      slug: 'cat1',
    });
  });

  it('uses slugified name when id is missing', () => {
    const categories: ApiFaqCategory[] = [
      { name: 'Help Center', faqs: [] },
    ];
    const result = buildHelpCategories(categories);
    expect(result[0]!.slug).toBe('help-center');
  });

  it('filters out null entries', () => {
    const categories = [null, { id: 'c1', name: 'Valid', faqs: [] }] as any;
    const result = buildHelpCategories(categories);
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe('Valid');
  });

  it('filters out entries where slug cannot be generated', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const categories: ApiFaqCategory[] = [
      { name: '', faqs: [] }, // no id, name='' → slugify('') → '' → skip
    ];
    const result = buildHelpCategories(categories);
    expect(result).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  it('handles missing description and faqs gracefully', () => {
    const categories: ApiFaqCategory[] = [
      { id: 'x', name: 'No Desc', faqs: [] },
    ];
    const result = buildHelpCategories(categories);
    expect(result[0]!.description).toBe('');
    expect(result[0]!.faqCount).toBe(0);
  });

  it('counts faqs correctly', () => {
    const categories: ApiFaqCategory[] = [
      { id: 'c1', name: 'Cat', faqs: [
        { topic: 'Q1', description: 'A1' },
        { topic: 'Q2', description: 'A2' },
        { topic: 'Q3', description: 'A3' },
      ]},
    ];
    const result = buildHelpCategories(categories);
    expect(result[0]!.faqCount).toBe(3);
  });

  it('returns 0 faqCount when faqs is not an array', () => {
    const categories = [{ id: 'c1', name: 'Cat', faqs: null }] as any;
    const result = buildHelpCategories(categories);
    expect(result[0]!.faqCount).toBe(0);
  });
});

describe('buildCategoryFaqsMap', () => {
  it('returns empty map for non-array input', () => {
    expect(buildCategoryFaqsMap(null as any)).toEqual({});
    expect(buildCategoryFaqsMap(undefined as any)).toEqual({});
  });

  it('returns empty map for empty array', () => {
    expect(buildCategoryFaqsMap([])).toEqual({});
  });

  it('builds correct map from valid categories', () => {
    const categories: ApiFaqCategory[] = [
      {
        id: 'cat1',
        name: 'General',
        faqs: [
          { topic: 'How to login?', description: 'Use your credentials.' },
        ],
      },
    ];
    const result = buildCategoryFaqsMap(categories);
    expect(result['cat1']).toEqual({
      title: 'General FAQs',
      faqs: [{ question: 'How to login?', answer: 'Use your credentials.' }],
    });
  });

  it('uses slugified name when id is missing', () => {
    const categories: ApiFaqCategory[] = [
      { name: 'Help Center', faqs: [{ topic: 'Q', description: 'A' }] },
    ];
    const result = buildCategoryFaqsMap(categories);
    expect(result['help-center']).toBeDefined();
    expect(result['help-center']!.title).toBe('Help Center FAQs');
  });

  it('skips null category entries', () => {
    const categories = [null, { id: 'c1', name: 'Valid', faqs: [] }] as any;
    const result = buildCategoryFaqsMap(categories);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['c1']).toBeDefined();
  });

  it('skips categories with empty slugs', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const categories: ApiFaqCategory[] = [
      { name: '', faqs: [] },
    ];
    const result = buildCategoryFaqsMap(categories);
    expect(Object.keys(result)).toHaveLength(0);
    consoleSpy.mockRestore();
  });

  it('skips duplicate slugs and warns', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const categories: ApiFaqCategory[] = [
      { id: 'dup', name: 'First', faqs: [] },
      { id: 'dup', name: 'Second', faqs: [] },
    ];
    const result = buildCategoryFaqsMap(categories);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['dup']!.title).toBe('First FAQs');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping duplicate'), expect.anything());
    consoleSpy.mockRestore();
  });

  it('filters out null faq entries within a category', () => {
    const categories = [
      { id: 'c1', name: 'Cat', faqs: [null, { topic: 'Q1', description: 'A1' }] },
    ] as any;
    const result = buildCategoryFaqsMap(categories);
    expect(result['c1']!.faqs).toHaveLength(1);
    expect(result['c1']!.faqs[0]).toEqual({ question: 'Q1', answer: 'A1' });
  });

  it('handles missing faq topic and description with empty strings', () => {
    const categories = [
      { id: 'c1', name: 'Cat', faqs: [{ topic: undefined, description: undefined }] },
    ] as any;
    const result = buildCategoryFaqsMap(categories);
    expect(result['c1']!.faqs[0]).toEqual({ question: '', answer: '' });
  });

  it('handles non-array faqs field in category', () => {
    const categories = [{ id: 'c1', name: 'Cat', faqs: null }] as any;
    const result = buildCategoryFaqsMap(categories);
    expect(result['c1']!.faqs).toEqual([]);
  });

  it('uses "Unknown" in title when category name is empty', () => {
    const categories = [{ id: 'c1', name: '', faqs: [] }] as any;
    const result = buildCategoryFaqsMap(categories);
    expect(result['c1']!.title).toBe('Unknown FAQs');
  });
});
