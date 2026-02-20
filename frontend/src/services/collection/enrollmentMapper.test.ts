import { describe, it, expect } from 'vitest';
import {
  getEnrollableBatches,
  formatBatchDisplayDate,
  getEnrollmentForCollection,
  getLeafContentIds,
  getContentStatusMap,
  getCourseProgressProps,
  getFirstCertPreviewUrl,
} from './enrollmentMapper';
import { BATCH_STATUS } from '../../types/collectionTypes';
import type { BatchListItem } from '../../types/collectionTypes';
import type { CertTemplate, CollectionData, ContentStateItem } from '../../types/collectionTypes';
import type { TrackableCollection } from '../../types/TrackableCollections';

describe('enrollmentMapper', () => {
  describe('getEnrollableBatches', () => {
    it('returns empty array when batches is undefined', () => {
      expect(getEnrollableBatches(undefined)).toEqual([]);
    });

    it('returns empty array when batches is empty', () => {
      expect(getEnrollableBatches([])).toEqual([]);
    });

    it('filters out Expired status batches', () => {
      const batches: BatchListItem[] = [
        { identifier: 'b1', status: BATCH_STATUS.Ongoing },
        { identifier: 'b2', status: BATCH_STATUS.Expired },
      ];
      expect(getEnrollableBatches(batches)).toHaveLength(1);
      expect(getEnrollableBatches(batches)[0]?.identifier).toBe('b1');
    });

    it('keeps Ongoing and Upcoming batches', () => {
      const batches: BatchListItem[] = [
        { identifier: 'b1', status: BATCH_STATUS.Ongoing },
        { identifier: 'b2', status: BATCH_STATUS.Upcoming },
      ];
      expect(getEnrollableBatches(batches)).toHaveLength(2);
    });

    it('keeps batch when enrollmentEndDate is null or empty', () => {
      const batches: BatchListItem[] = [
        { identifier: 'b1', status: BATCH_STATUS.Ongoing, enrollmentEndDate: null },
        { identifier: 'b2', status: BATCH_STATUS.Ongoing, enrollmentEndDate: '' },
      ];
      expect(getEnrollableBatches(batches)).toHaveLength(2);
    });

    it('filters out batch when enrollmentEndDate is in the past', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const batches: BatchListItem[] = [
        { identifier: 'b1', status: BATCH_STATUS.Ongoing, enrollmentEndDate: past },
      ];
      expect(getEnrollableBatches(batches)).toHaveLength(0);
    });

    it('keeps batch when enrollmentEndDate is in the future', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const batches: BatchListItem[] = [
        { identifier: 'b1', status: BATCH_STATUS.Ongoing, enrollmentEndDate: future },
      ];
      expect(getEnrollableBatches(batches)).toHaveLength(1);
    });

    it('uses provided now for enrollment end date check', () => {
      const future = new Date('2030-01-15').toISOString();
      const now = new Date('2030-01-01');
      const batches: BatchListItem[] = [
        { identifier: 'b1', status: BATCH_STATUS.Ongoing, enrollmentEndDate: future },
      ];
      expect(getEnrollableBatches(batches, now)).toHaveLength(1);
    });
  });

  describe('formatBatchDisplayDate', () => {
    it('returns "-" for null or undefined', () => {
      expect(formatBatchDisplayDate(null)).toBe('-');
      expect(formatBatchDisplayDate(undefined)).toBe('-');
    });

    it('returns "-" for empty string', () => {
      expect(formatBatchDisplayDate('')).toBe('-');
    });

    it('returns "-" for invalid date string', () => {
      expect(formatBatchDisplayDate('not-a-date')).toBe('-');
    });

    it('returns formatted date for valid ISO string', () => {
      const result = formatBatchDisplayDate('2025-06-15T00:00:00.000Z');
      expect(result).not.toBe('-');
      expect(result).toMatch(/\d+/);
      expect(result).toMatch(/2025/);
      expect(result.length).toBeGreaterThan(4);
    });
  });

  describe('getEnrollmentForCollection', () => {
    it('returns undefined when collectionId is undefined', () => {
      const courses: TrackableCollection[] = [
        {
          courseId: 'c1',
          courseName: 'Course',
          contentId: 'c1',
          collectionId: 'c1',
          batchId: 'b1',
          userId: 'u1',
          addedBy: 'a',
          active: true,
          status: 1,
          completionPercentage: 0,
          progress: 0,
          leafNodesCount: 5,
          description: '',
          courseLogoUrl: '',
          dateTime: 0,
          enrolledDate: 0,
        },
      ];
      expect(getEnrollmentForCollection(courses, undefined)).toBeUndefined();
    });

    it('returns undefined when courses is undefined or empty', () => {
      expect(getEnrollmentForCollection(undefined, 'col-1')).toBeUndefined();
      expect(getEnrollmentForCollection([], 'col-1')).toBeUndefined();
    });

    it('returns enrollment when courseId matches', () => {
      const enrollment: TrackableCollection = {
        courseId: 'col-1',
        courseName: 'Course',
        contentId: 'col-1',
        collectionId: 'col-1',
        batchId: 'b1',
        userId: 'u1',
        addedBy: 'a',
        active: true,
        status: 1,
        completionPercentage: 0,
        progress: 0,
        leafNodesCount: 5,
        description: '',
        courseLogoUrl: '',
        dateTime: 0,
        enrolledDate: 0,
      };
      const courses: TrackableCollection[] = [enrollment];
      expect(getEnrollmentForCollection(courses, 'col-1')).toBe(enrollment);
    });

    it('returns enrollment when contentId matches', () => {
      const enrollment: TrackableCollection = {
        courseId: 'other',
        courseName: 'Other',
        contentId: 'col-1',
        collectionId: 'other',
        batchId: 'b1',
        userId: 'u1',
        addedBy: 'a',
        active: true,
        status: 1,
        completionPercentage: 0,
        progress: 0,
        leafNodesCount: 5,
        description: '',
        courseLogoUrl: '',
        dateTime: 0,
        enrolledDate: 0,
      };
      const courses: TrackableCollection[] = [enrollment];
      expect(getEnrollmentForCollection(courses, 'col-1')).toBe(enrollment);
    });

    it('returns enrollment when collectionId property matches', () => {
      const enrollment: TrackableCollection = {
        courseId: 'other',
        courseName: 'Other',
        contentId: 'other',
        collectionId: 'col-1',
        batchId: 'b1',
        userId: 'u1',
        addedBy: 'a',
        active: true,
        status: 1,
        completionPercentage: 0,
        progress: 0,
        leafNodesCount: 5,
        description: '',
        courseLogoUrl: '',
        dateTime: 0,
        enrolledDate: 0,
      };
      const courses: TrackableCollection[] = [enrollment];
      expect(getEnrollmentForCollection(courses, 'col-1')).toBe(enrollment);
    });

    it('returns undefined when no course matches', () => {
      const courses: TrackableCollection[] = [
        {
          courseId: 'other',
          courseName: 'Other',
          contentId: 'other',
          collectionId: 'other',
          batchId: 'b1',
          userId: 'u1',
          addedBy: 'a',
          active: true,
          status: 1,
          completionPercentage: 0,
          progress: 0,
          leafNodesCount: 5,
          description: '',
          courseLogoUrl: '',
          dateTime: 0,
          enrolledDate: 0,
        },
      ];
      expect(getEnrollmentForCollection(courses, 'col-1')).toBeUndefined();
    });
  });

  describe('getLeafContentIds', () => {
    it('returns empty array when collectionData is null', () => {
      expect(getLeafContentIds(null)).toEqual([]);
    });

    it('returns empty array when modules is missing', () => {
      expect(
        getLeafContentIds({
          id: 'c1',
          title: '',
          lessons: 0,
          image: '',
          units: 0,
          description: '',
          audience: [],
          modules: [],
        } as CollectionData),
      ).toEqual([]);
    });

    it('returns flat list of lesson ids from all modules', () => {
      const collectionData: CollectionData = {
        id: 'c1',
        title: 'Course',
        lessons: 3,
        image: '',
        units: 2,
        description: '',
        audience: [],
        modules: [
          {
            id: 'm1',
            title: 'M1',
            subtitle: '',
            lessons: [
              { id: 'l1', title: 'L1', type: 'video' },
              { id: 'l2', title: 'L2', type: 'document' },
            ],
          },
          {
            id: 'm2',
            title: 'M2',
            subtitle: '',
            lessons: [{ id: 'l3', title: 'L3', type: 'video' }],
          },
        ],
      };
      expect(getLeafContentIds(collectionData)).toEqual(['l1', 'l2', 'l3']);
    });
  });

  describe('getContentStatusMap', () => {
    it('returns empty object for empty contentList', () => {
      expect(getContentStatusMap([])).toEqual({});
    });

    it('maps contentId to status for each item', () => {
      const list = [
        { contentId: 'c1', status: 0 },
        { contentId: 'c2', status: 2 },
      ];
      expect(getContentStatusMap(list)).toEqual({ c1: 0, c2: 2 });
    });

    it('skips items with missing contentId or status', () => {
      const list = [
        { contentId: 'c1', status: 1 },
        { contentId: null, status: 2 },
        { contentId: 'c3' },
      ] as ContentStateItem[];
      expect(getContentStatusMap(list)).toEqual({ c1: 1 });
    });
  });

  describe('getCourseProgressProps', () => {
    it('returns null when enrollment is undefined', () => {
      const collectionData = {
        id: 'c1',
        title: '',
        lessons: 5,
        image: '',
        units: 1,
        description: '',
        audience: [],
        modules: [],
      } as CollectionData;
      expect(getCourseProgressProps(undefined, collectionData, 5, 2)).toBeNull();
    });

    it('returns null when collectionData is null', () => {
      const enrollment = {
        batch: { startDate: '2025-01-01' },
        leafNodesCount: 5,
        contentStatus: {},
        completionPercentage: 0,
      } as unknown as TrackableCollection;
      expect(getCourseProgressProps(enrollment, null, 5, 2)).toBeNull();
    });

    it('returns props with total from totalFromState and completed from completedFromState when totalFromState > 0', () => {
      const enrollment = {
        batch: { startDate: '2025-01-01' },
        leafNodesCount: 10,
      } as unknown as TrackableCollection;
      const collectionData = {
        id: 'c1',
        title: '',
        lessons: 5,
        image: '',
        units: 1,
        description: '',
        audience: [],
        modules: [],
      } as CollectionData;
      const result = getCourseProgressProps(enrollment, collectionData, 10, 3);
      expect(result).toEqual({
        batchStartDate: '2025-01-01',
        totalContentCount: 10,
        completedContentCount: 3,
      });
    });

    it('falls back to collectionData.lessons and enrollment.leafNodesCount for total when totalFromState is 0', () => {
      const enrollment = { batch: {}, leafNodesCount: 8 } as unknown as TrackableCollection;
      const collectionData = {
        id: 'c1',
        title: '',
        lessons: 6,
        image: '',
        units: 1,
        description: '',
        audience: [],
        modules: [],
      } as CollectionData;
      const result = getCourseProgressProps(enrollment, collectionData, 0, 0);
      expect(result?.totalContentCount).toBe(6);
    });

    it('uses enrollment.contentStatus for completed count when totalFromState is 0 and contentStatus is object', () => {
      const enrollment = {
        batch: {},
        leafNodesCount: 5,
        contentStatus: { c1: 2, c2: 2, c3: 1 },
      } as unknown as TrackableCollection;
      const collectionData = {
        id: 'c1',
        title: '',
        lessons: 5,
        image: '',
        units: 1,
        description: '',
        audience: [],
        modules: [],
      } as CollectionData;
      const result = getCourseProgressProps(enrollment, collectionData, 0, 0);
      expect(result?.completedContentCount).toBe(2);
    });

    it('uses completionPercentage for completed when totalFromState 0 and no contentStatus', () => {
      const enrollment = {
        batch: {},
        leafNodesCount: 10,
        completionPercentage: 50,
      } as unknown as TrackableCollection;
      const collectionData = {
        id: 'c1',
        title: '',
        lessons: 10,
        image: '',
        units: 1,
        description: '',
        audience: [],
        modules: [],
      } as CollectionData;
      const result = getCourseProgressProps(enrollment, collectionData, 0, 0);
      expect(result?.completedContentCount).toBe(5);
    });
  });

  describe('getFirstCertPreviewUrl', () => {
    it('returns undefined when certTemplates is undefined', () => {
      expect(getFirstCertPreviewUrl(undefined)).toBeUndefined();
    });

    it('returns undefined when certTemplates is not an object', () => {
      expect(getFirstCertPreviewUrl(null as unknown as Record<string, CertTemplate>)).toBeUndefined();
    });

    it('returns undefined when object is empty', () => {
      expect(getFirstCertPreviewUrl({})).toBeUndefined();
    });

    it('returns previewUrl of first template', () => {
      const templates: Record<string, CertTemplate> = {
        cert1: { identifier: 'c1', previewUrl: 'https://preview.example.com/1' },
        cert2: { identifier: 'c2', previewUrl: 'https://preview.example.com/2' },
      };
      expect(getFirstCertPreviewUrl(templates)).toBe('https://preview.example.com/1');
    });

    it('returns undefined when first template has no previewUrl', () => {
      const templates: Record<string, CertTemplate> = {
        cert1: { identifier: 'c1' },
      };
      expect(getFirstCertPreviewUrl(templates)).toBeUndefined();
    });
  });
});
