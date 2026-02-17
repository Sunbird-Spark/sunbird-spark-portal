import { describe, it, expect } from 'vitest';
import { mapSearchContentToRelatedContentItems } from './relatedContentMapper';
import type { RelatedContentSearchItem } from '../../types/collectionTypes';

describe('relatedContentMapper', () => {
  describe('mapSearchContentToRelatedContentItems', () => {
    it('returns empty array when items is undefined', () => {
      expect(mapSearchContentToRelatedContentItems(undefined)).toEqual([]);
    });

    it('returns empty array when items is empty', () => {
      expect(mapSearchContentToRelatedContentItems([])).toEqual([]);
    });

    it('filters to root-level items only (visibility Default, no parent)', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'root-1', name: 'Root Item', visibility: 'Default' },
        { identifier: 'child-1', name: 'Child Item', visibility: 'Parent', parent: 'root-1' },
      ];
      const result = mapSearchContentToRelatedContentItems(items);
      expect(result).toHaveLength(1);
      expect(result[0]!.identifier).toBe('root-1');
      expect(result[0]!.name).toBe('Root Item');
    });

    it('excludes item matching excludeId', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'a', name: 'A', visibility: 'Default' },
        { identifier: 'b', name: 'B', visibility: 'Default' },
      ];
      const result = mapSearchContentToRelatedContentItems(items, 'a');
      expect(result).toHaveLength(1);
      expect(result[0]!.identifier).toBe('b');
    });

    it('limits to specified limit', () => {
      const items: RelatedContentSearchItem[] = Array.from({ length: 5 }, (_, i) => ({
        identifier: `id-${i}`,
        name: `Item ${i}`,
        visibility: 'Default',
      }));
      const result = mapSearchContentToRelatedContentItems(items, undefined, 2);
      expect(result).toHaveLength(2);
    });

    it('maps search results preserving mimeType and sets cardType from isResourceItem', () => {
      const items: RelatedContentSearchItem[] = [
        { identifier: 'v1', name: 'Video', visibility: 'Default', mimeType: 'video/mp4', appIcon: 'https://icon.png' },
        {
          identifier: 'c1',
          name: 'Course',
          visibility: 'Default',
          primaryCategory: 'Course',
          resourceType: 'Course',
        },
      ];
      const result = mapSearchContentToRelatedContentItems(items);
      expect(result).toHaveLength(2);
      expect(result[0]!.mimeType).toBe('video/mp4');
      expect(result[0]!.cardType).toBe('resource');
      expect(result[1]!.cardType).toBe('collection');
    });

    it('uses appIcon with fallback to posterImage then thumbnail', () => {
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
      const result = mapSearchContentToRelatedContentItems(items);
      expect(result[0]!.appIcon).toBe('https://icon.png');
    });
  });
});
