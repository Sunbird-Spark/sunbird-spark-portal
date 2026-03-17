import { describe, it, expect } from 'vitest';
import { buildCollectionCdata, buildObjectRollup } from './collectionTelemetryContext';
import type { HierarchyContentNode } from '@/types/collectionTypes';

describe('collectionTelemetryContext', () => {
  describe('buildCollectionCdata', () => {
    it('should return course and batch entries when both provided', () => {
      expect(buildCollectionCdata('course-1', 'batch-1')).toEqual([
        { id: 'course-1', type: 'course' },
        { id: 'batch-1', type: 'batch' },
      ]);
    });

    it('should return only course entry when batchId is undefined', () => {
      expect(buildCollectionCdata('course-1')).toEqual([
        { id: 'course-1', type: 'course' },
      ]);
    });

    it('should return empty array when both are undefined', () => {
      expect(buildCollectionCdata()).toEqual([]);
    });

    it('should return only course when batchId is empty string', () => {
      expect(buildCollectionCdata('course-1', '')).toEqual([
        { id: 'course-1', type: 'course' },
      ]);
    });
  });

  describe('buildObjectRollup', () => {
    const makeNode = (id: string, children?: HierarchyContentNode[]): HierarchyContentNode => ({
      identifier: id,
      children,
    });

    it('should return empty object when hierarchyRoot is null', () => {
      expect(buildObjectRollup(null, 'content-1')).toEqual({});
    });

    it('should return empty object when contentId is undefined', () => {
      expect(buildObjectRollup(makeNode('root'))).toEqual({});
    });

    it('should return empty object when content is the root itself', () => {
      expect(buildObjectRollup(makeNode('root'), 'root')).toEqual({});
    });

    it('should return l1 for content directly under root', () => {
      const root = makeNode('collection-1', [
        makeNode('content-1'),
        makeNode('content-2'),
      ]);

      expect(buildObjectRollup(root, 'content-1')).toEqual({ l1: 'collection-1' });
    });

    it('should return l1 and l2 for content nested two levels deep', () => {
      const root = makeNode('collection-1', [
        makeNode('unit-1', [
          makeNode('content-1'),
        ]),
      ]);

      expect(buildObjectRollup(root, 'content-1')).toEqual({
        l1: 'collection-1',
        l2: 'unit-1',
      });
    });

    it('should return up to l3 for deeply nested content', () => {
      const root = makeNode('collection-1', [
        makeNode('unit-1', [
          makeNode('subunit-1', [
            makeNode('content-1'),
          ]),
        ]),
      ]);

      expect(buildObjectRollup(root, 'content-1')).toEqual({
        l1: 'collection-1',
        l2: 'unit-1',
        l3: 'subunit-1',
      });
    });

    it('should cap at 4 levels for very deep nesting', () => {
      const root = makeNode('l1', [
        makeNode('l2', [
          makeNode('l3', [
            makeNode('l4', [
              makeNode('l5', [
                makeNode('content-1'),
              ]),
            ]),
          ]),
        ]),
      ]);

      const result = buildObjectRollup(root, 'content-1');
      expect(result).toEqual({
        l1: 'l1',
        l2: 'l2',
        l3: 'l3',
        l4: 'l4',
      });
    });

    it('should return empty object when content is not found', () => {
      const root = makeNode('collection-1', [
        makeNode('unit-1', [makeNode('content-1')]),
      ]);

      expect(buildObjectRollup(root, 'nonexistent')).toEqual({});
    });

    it('should find content in the correct branch of the tree', () => {
      const root = makeNode('collection-1', [
        makeNode('unit-1', [makeNode('content-A')]),
        makeNode('unit-2', [makeNode('content-B')]),
      ]);

      expect(buildObjectRollup(root, 'content-B')).toEqual({
        l1: 'collection-1',
        l2: 'unit-2',
      });
    });
  });
});
