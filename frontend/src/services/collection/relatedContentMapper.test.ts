import { describe, it, expect } from 'vitest';
import { mapSearchContentToRelatedItems } from './relatedContentMapper';
import type { RelatedContentSearchItem } from '../../types/collectionTypes';

describe('relatedContentMapper', () => {
  describe('mapSearchContentToRelatedItems', () => {
    it('returns empty array when items is undefined', () => {
      expect(mapSearchContentToRelatedItems(undefined)).toEqual([]);
    });

    it('returns empty array when items is empty', () => {
      expect(mapSearchContentToRelatedItems([])).toEqual([]);
    });

    it('filters to root-level items only (visibility Default, no parent)', () => {
      const items: RelatedContentSearchItem[] = [
        {
          identifier: 'root-1',
          name: 'Root Item',
          visibility: 'Default',
        },
        {
          identifier: 'child-1',
          name: 'Child Item',
          visibility: 'Parent',
          parent: 'root-1',
        },
      ];

      const result = mapSearchContentToRelatedItems(items);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('root-1');
      expect(result[0]!.title).toBe('Root Item');
    });

    it('excludes item matching excludeId', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'a', name: 'A', visibility: 'Default' },
        { identifier: 'b', name: 'B', visibility: 'Default' },
      ];
      const result = mapSearchContentToRelatedItems(items, 'a');
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('b');
    });

    it('limits results to specified limit', () => {
      const items: RelatedContentSearchItem[] = Array.from({ length: 5 }, (_, i) => ({
        identifier: `id-${i}`,
        name: `Item ${i}`,
        visibility: 'Default',
      }));
      const result = mapSearchContentToRelatedItems(items, undefined, 2);
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('id-0');
      expect(result[1]!.id).toBe('id-1');
    });

    it('maps video mimeType to type Video and isResource true', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'v1', name: 'Video', visibility: 'Default', mimeType: 'video/mp4' },
      ];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.type).toBe('Video');
      expect(result[0]!.isResource).toBe(true);
    });

    it('maps PDF mimeType to type PDF and isResource true', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'p1', name: 'PDF', visibility: 'Default', mimeType: 'application/pdf' },
      ];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.type).toBe('PDF');
      expect(result[0]!.isResource).toBe(true);
    });

    it('maps epub mimeType to type Epub and isResource true', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'e1', name: 'Epub', visibility: 'Default', mimeType: 'application/epub' },
      ];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.type).toBe('Epub');
      expect(result[0]!.isResource).toBe(true);
    });

    it('maps resourceType Course to type Course and isResource false', () => {
      const items: RelatedContentSearchItem[] = [
        {
          identifier: 'c1',
          name: 'Course',
          visibility: 'Default',
          primaryCategory: 'Course',
          resourceType: 'Course',
        },
      ];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.type).toBe('Course');
      expect(result[0]!.isResource).toBe(false);
    });

    it('uses appIcon for image, fallback to posterImage then thumbnail', () => {
      const items: RelatedContentSearchItem[] = [
        {
          identifier: 'a',
          name: 'A',
          visibility: 'Default',
          appIcon: 'https://icon.png',
          posterImage: 'https://poster.png',
          thumbnail: 'https://thumb.png',
        },
      ];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.image).toBe('https://icon.png');

      const items2: RelatedContentSearchItem[] = [
        { identifier: 'b', name: 'B', visibility: 'Default', posterImage: 'https://poster.png' },
      ];
      const result2 = mapSearchContentToRelatedItems(items2);
      expect(result2[0]!.image).toBe('https://poster.png');

      const items3: RelatedContentSearchItem[] = [
        { identifier: 'c', name: 'C', visibility: 'Default', thumbnail: 'https://thumb.png' },
      ];
      const result3 = mapSearchContentToRelatedItems(items3);
      expect(result3[0]!.image).toBe('https://thumb.png');

      const items4: RelatedContentSearchItem[] = [{ identifier: 'd', name: 'D', visibility: 'Default' }];
      const result4 = mapSearchContentToRelatedItems(items4);
      expect(result4[0]!.image).toBe('');
    });

    it('maps leafNodesCount to lessons', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'a', name: 'A', visibility: 'Default', leafNodesCount: 8 },
      ];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.lessons).toBe(8);
    });

    it('uses "Untitled" when name is missing', () => {
      const items: RelatedContentSearchItem[] = [{ identifier: 'a', visibility: 'Default' }];
      const result = mapSearchContentToRelatedItems(items);
      expect(result[0]!.title).toBe('Untitled');
    });

    it('defaults to limit 3 when not specified', () => {
      const items: RelatedContentSearchItem[] = Array.from({ length: 5 }, (_, i) => ({
        identifier: `id-${i}`,
        name: `Item ${i}`,
        visibility: 'Default',
      }));
      const result = mapSearchContentToRelatedItems(items);
      expect(result).toHaveLength(3);
    });
  });
});
