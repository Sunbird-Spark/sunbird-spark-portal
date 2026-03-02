import { describe, it, expect } from 'vitest';
import {
  parseHierarchy,
  getLeafContentIdsFromHierarchy,
  getFirstLeafContentIdFromHierarchy,
  findNodeById,
} from './hierarchyTree';
import type { HierarchyContentNode } from '../../types/collectionTypes';

const COLLECTION_MIME = 'application/vnd.ekstep.content-collection';

describe('hierarchyTree', () => {
  describe('parseHierarchy', () => {
    it('returns null when root is null', () => {
      expect(parseHierarchy(null as unknown as HierarchyContentNode)).toBeNull();
    });

    it('returns null when root is undefined', () => {
      expect(parseHierarchy(undefined as unknown as HierarchyContentNode)).toBeNull();
    });

    it('returns tree when root is valid', () => {
      const root: HierarchyContentNode = { identifier: 'col-1', name: 'Course', mimeType: COLLECTION_MIME, children: [] };
      const tree = parseHierarchy(root);
      expect(tree).not.toBeNull();
      expect(tree?.model.identifier).toBe('col-1');
    });
  });

  describe('getLeafContentIdsFromHierarchy', () => {
    it('returns empty array when root is null', () => {
      expect(getLeafContentIdsFromHierarchy(null)).toEqual([]);
    });

    it('returns empty array when root has no children and is collection', () => {
      const root: HierarchyContentNode = { identifier: 'col-1', mimeType: COLLECTION_MIME, children: [] };
      expect(getLeafContentIdsFromHierarchy(root)).toEqual([]);
    });

    it('skips root when root is collection and returns leaf ids from children in depth-first order', () => {
      const root: HierarchyContentNode = {
        identifier: 'col-1',
        mimeType: COLLECTION_MIME,
        children: [
          { identifier: 'l1', name: 'Lesson 1', mimeType: 'video/mp4' },
          { identifier: 'l2', name: 'Lesson 2', mimeType: 'application/pdf' },
        ],
      };
      expect(getLeafContentIdsFromHierarchy(root)).toEqual(['l1', 'l2']);
    });

    it('returns multi-level leaf ids in depth-first order and skips collection nodes', () => {
      const root: HierarchyContentNode = {
        identifier: 'col-1',
        mimeType: COLLECTION_MIME,
        children: [
          {
            identifier: 'unit-1',
            mimeType: COLLECTION_MIME,
            children: [
              { identifier: 'l1', mimeType: 'video/mp4' },
              {
                identifier: 'sub-unit',
                mimeType: COLLECTION_MIME,
                children: [{ identifier: 'l2', mimeType: 'application/pdf' }],
              },
            ],
          },
          { identifier: 'l3', mimeType: 'video/mp4' },
        ],
      };
      expect(getLeafContentIdsFromHierarchy(root)).toEqual(['l1', 'l2', 'l3']);
    });

    it('returns single-element array when root is non-collection (e.g. content node)', () => {
      const root: HierarchyContentNode = { identifier: 'only-leaf', name: 'Doc', mimeType: 'application/pdf' };
      expect(getLeafContentIdsFromHierarchy(root)).toEqual(['only-leaf']);
    });
  });

  describe('getFirstLeafContentIdFromHierarchy', () => {
    it('returns undefined when root is null', () => {
      expect(getFirstLeafContentIdFromHierarchy(null)).toBeUndefined();
    });

    it('returns undefined when hierarchy has only collection nodes', () => {
      const root: HierarchyContentNode = {
        identifier: 'col-1',
        mimeType: COLLECTION_MIME,
        children: [{ identifier: 'unit-1', mimeType: COLLECTION_MIME, children: [] }],
      };
      expect(getFirstLeafContentIdFromHierarchy(root)).toBeUndefined();
    });

    it('returns first leaf content id in depth-first order', () => {
      const root: HierarchyContentNode = {
        identifier: 'col-1',
        mimeType: COLLECTION_MIME,
        children: [
          {
            identifier: 'unit-1',
            mimeType: COLLECTION_MIME,
            children: [
              { identifier: 'first', mimeType: 'video/mp4' },
              { identifier: 'second', mimeType: 'application/pdf' },
            ],
          },
        ],
      };
      expect(getFirstLeafContentIdFromHierarchy(root)).toBe('first');
    });

    it('returns root identifier when root is non-collection', () => {
      const root: HierarchyContentNode = { identifier: 'single-doc', mimeType: 'application/pdf' };
      expect(getFirstLeafContentIdFromHierarchy(root)).toBe('single-doc');
    });
  });

  describe('findNodeById', () => {
    it('returns undefined when root is null or undefined', () => {
      expect(findNodeById(null, 'id')).toBeUndefined();
      expect(findNodeById(undefined, 'id')).toBeUndefined();
    });

    it('returns undefined when id is empty', () => {
      const root: HierarchyContentNode = { identifier: 'root', mimeType: 'video/mp4' };
      expect(findNodeById(root, '')).toBeUndefined();
    });

    it('returns root when root.identifier matches id', () => {
      const root: HierarchyContentNode = { identifier: 'target', name: 'Target', mimeType: 'video/mp4' };
      expect(findNodeById(root, 'target')).toBe(root);
    });

    it('returns undefined when root does not match and has no children', () => {
      const root: HierarchyContentNode = { identifier: 'root', mimeType: 'video/mp4' };
      expect(findNodeById(root, 'other')).toBeUndefined();
    });

    it('finds node in direct children', () => {
      const child: HierarchyContentNode = { identifier: 'child', name: 'Child', mimeType: 'application/pdf' };
      const root: HierarchyContentNode = {
        identifier: 'root',
        mimeType: 'application/vnd.ekstep.content-collection',
        children: [child],
      };
      expect(findNodeById(root, 'child')).toBe(child);
    });

    it('finds node in nested hierarchy', () => {
      const deep: HierarchyContentNode = { identifier: 'deep', name: 'Deep', mimeType: 'video/mp4' };
      const root: HierarchyContentNode = {
        identifier: 'root',
        mimeType: 'application/vnd.ekstep.content-collection',
        children: [
          {
            identifier: 'unit',
            mimeType: 'application/vnd.ekstep.content-collection',
            children: [deep],
          },
        ],
      };
      expect(findNodeById(root, 'deep')).toBe(deep);
    });

    it('returns first match in depth-first order when multiple nodes share same id', () => {
      const first: HierarchyContentNode = { identifier: 'x', name: 'First', mimeType: 'video/mp4' };
      const root: HierarchyContentNode = {
        identifier: 'root',
        mimeType: 'application/vnd.ekstep.content-collection',
        children: [
          first,
          { identifier: 'unit', mimeType: 'application/vnd.ekstep.content-collection', children: [{ identifier: 'x', mimeType: 'video/mp4' }] },
        ],
      };
      expect(findNodeById(root, 'x')).toBe(first);
    });
  });
});
