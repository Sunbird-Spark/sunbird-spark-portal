import { describe, it, expect } from 'vitest';
import { mapToCollectionData } from './collectionMapper';
import type { HierarchyContentNode } from '../../types/collectionTypes';

describe('collectionMapper', () => {
  describe('mapToCollectionData', () => {
    it('maps root content to CollectionData with required fields', () => {
      const content: HierarchyContentNode = {
        identifier: 'col-1',
        name: 'Test Collection',
        description: 'A test description',
        appIcon: 'https://icon.png',
        leafNodesCount: 5,
        audience: ['Student', 'Teacher'],
      };

      const result = mapToCollectionData(content);

      expect(result.id).toBe('col-1');
      expect(result.title).toBe('Test Collection');
      expect(result.description).toBe('A test description');
      expect(result.image).toBe('https://icon.png');
      expect(result.lessons).toBe(5);
      expect(result.audience).toEqual(['Student', 'Teacher']);
      expect(result.modules).toEqual([]);
    });

    it('uses fallback "Untitled" when name is missing', () => {
      const content: HierarchyContentNode = { identifier: 'col-1' };
      expect(mapToCollectionData(content).title).toBe('Untitled');
    });

    it('uses fallback empty string when description is missing', () => {
      const content: HierarchyContentNode = { identifier: 'col-1' };
      expect(mapToCollectionData(content).description).toBe('');
    });

    it('uses fallback empty string when appIcon is missing', () => {
      const content: HierarchyContentNode = { identifier: 'col-1' };
      expect(mapToCollectionData(content).image).toBe('');
    });

    it('uses leafNodesCount for lessons, or 0 when missing', () => {
      expect(mapToCollectionData({ identifier: 'a', leafNodesCount: 10 }).lessons).toBe(10);
      expect(mapToCollectionData({ identifier: 'a' }).lessons).toBe(0);
    });

    it('maps audience from API when array', () => {
      const content: HierarchyContentNode = {
        identifier: 'a',
        audience: ['Learner', 'Educator'],
      };
      expect(mapToCollectionData(content).audience).toEqual(['Learner', 'Educator']);
    });

    it('uses empty audience when audience is not array', () => {
      const content = { identifier: 'a', audience: null } as unknown as HierarchyContentNode;
      expect(mapToCollectionData(content).audience).toEqual([]);
    });

    it('maps children to modules with lessons', () => {
      const content: HierarchyContentNode = {
        identifier: 'col-1',
        name: 'Course',
        children: [
          {
            identifier: 'unit-1',
            name: 'Unit 1',
            primaryCategory: 'Course Unit',
            description: 'Unit desc',
            children: [
              { identifier: 'l1', name: 'Lesson 1', mimeType: 'video/mp4' },
              { identifier: 'l2', name: 'Lesson 2', mimeType: 'application/pdf' },
            ],
          },
        ],
      };

      const result = mapToCollectionData(content);

      expect(result.modules).toHaveLength(1);
      expect(result.modules[0]!).toEqual({
        id: 'unit-1',
        title: 'Unit 1',
        subtitle: 'Course Unit',
        lessons: [
          { id: 'l1', title: 'Lesson 1', duration: '—', type: 'video' },
          { id: 'l2', title: 'Lesson 2', duration: '—', type: 'document' },
        ],
      });
      expect(result.units).toBe(1);
    });

    it('maps mimeType video/* to lesson type video', () => {
      const content: HierarchyContentNode = {
        identifier: 'a',
        children: [
          {
            identifier: 'u1',
            name: 'U1',
            children: [{ identifier: 'l1', name: 'L1', mimeType: 'video/mp4' }],
          },
        ],
      };
      const result = mapToCollectionData(content);
      expect(result.modules[0]!.lessons[0]!.type).toBe('video');
    });

    it('maps mimeType pdf/epub etc to lesson type document', () => {
      const content: HierarchyContentNode = {
        identifier: 'a',
        children: [
          {
            identifier: 'u1',
            name: 'U1',
            children: [
              { identifier: 'l1', name: 'L1', mimeType: 'application/pdf' },
              { identifier: 'l2', name: 'L2', mimeType: 'application/epub' },
              { identifier: 'l3', name: 'L3' },
            ],
          },
        ],
      };
      const result = mapToCollectionData(content);
      expect(result.modules[0]!.lessons[0]!.type).toBe('document');
      expect(result.modules[0]!.lessons[1]!.type).toBe('document');
      expect(result.modules[0]!.lessons[2]!.type).toBe('document');
    });

    it('uses primaryCategory for module subtitle, fallback to description', () => {
      const content: HierarchyContentNode = {
        identifier: 'a',
        children: [
          { identifier: 'u1', name: 'U1', primaryCategory: 'Unit' },
          { identifier: 'u2', name: 'U2', description: 'Desc only' },
          { identifier: 'u3', name: 'U3' },
        ],
      };
      const result = mapToCollectionData(content);
      expect(result.modules[0]!.subtitle).toBe('Unit');
      expect(result.modules[1]!.subtitle).toBe('Desc only');
      expect(result.modules[2]!.subtitle).toBe('');
    });

    it('sets units from modules length when present', () => {
      const content: HierarchyContentNode = {
        identifier: 'a',
        children: [
          { identifier: 'u1', name: 'U1' },
          { identifier: 'u2', name: 'U2' },
        ],
      };
      const result = mapToCollectionData(content);
      expect(result.units).toBe(2);
    });

    it('uses units 0 when no modules', () => {
      const content: HierarchyContentNode = { identifier: 'a' };
      const result = mapToCollectionData(content);
      expect(result.units).toBe(0);
    });
  });
});
