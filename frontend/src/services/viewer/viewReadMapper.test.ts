import { describe, it, expect } from 'vitest';
import {
  getViewReadItems,
  findViewReadItem,
  resolveViewReadStatus,
  extractProgressDetailsValue,
  isIndividualScopeRecord,
} from './viewReadMapper';
import type { ViewReadResponse } from '../../types/viewerServiceTypes';

// Real POST /v1/view/read response, verbatim.
const LIVE_RESPONSE: ViewReadResponse = {
  response: [
    {
      dateTime: null,
      lastAccessTime: '2026-08-12T09:12:37.986+00:00',
      contentId: 'do_2146344654141276161136',
      oldLastUpdatedTime: null,
      batchId: 'do_2146344654141276161136',
      completedCount: null,
      userId: '79e992dc-a08a-4709-9d5d-dc559da8e5e7',
      progressdetails: '{"progress":100}',
      completionPercentage: null,
      oldLastCompletedTime: null,
      progress: null,
      lastUpdatedTime: '2026-08-12T10:03:30.767+00:00',
      viewCount: null,
      courseId: 'do_2146344654141276161136',
      lastCompletedTime: '2026-08-12T10:03:30.767+00:00',
      oldLastAccessTime: null,
      status: 2,
    },
  ],
};

describe('getViewReadItems', () => {
  it('reads the live response[] shape', () => {
    expect(getViewReadItems(LIVE_RESPONSE)).toHaveLength(1);
  });

  it('falls back to the spec contents[] shape', () => {
    const specShaped: ViewReadResponse = { contents: [{ contentId: 'do_x', status: 1 }] };
    expect(getViewReadItems(specShaped)).toEqual([{ contentId: 'do_x', status: 1 }]);
  });

  it('returns an empty array for null/undefined/empty input', () => {
    expect(getViewReadItems(null)).toEqual([]);
    expect(getViewReadItems(undefined)).toEqual([]);
    expect(getViewReadItems({})).toEqual([]);
  });
});

describe('findViewReadItem', () => {
  it('finds an item by contentId (live field name)', () => {
    const items = getViewReadItems(LIVE_RESPONSE);
    const found = findViewReadItem(items, 'do_2146344654141276161136');
    expect(found?.status).toBe(2);
  });

  it('falls back to identifier (spec field name)', () => {
    const items = [{ identifier: 'do_x', status: 1 }];
    expect(findViewReadItem(items, 'do_x')?.status).toBe(1);
  });

  it('returns undefined when nothing matches', () => {
    const items = getViewReadItems(LIVE_RESPONSE);
    expect(findViewReadItem(items, 'do_unrelated')).toBeUndefined();
  });
});

describe('resolveViewReadStatus', () => {
  it('prefers the direct status field when present (real payload: status 2)', () => {
    const item = findViewReadItem(getViewReadItems(LIVE_RESPONSE), 'do_2146344654141276161136');
    expect(resolveViewReadStatus(item)).toBe(2);
  });

  it('falls back to parsing progressdetails when status is absent', () => {
    expect(resolveViewReadStatus({ contentId: 'do_x', progressdetails: '{"progress":100}' })).toBe(2);
    expect(resolveViewReadStatus({ contentId: 'do_x', progressdetails: '{"progress":45}' })).toBe(1);
    expect(resolveViewReadStatus({ contentId: 'do_x', progressdetails: '{"progress":0}' })).toBe(0);
  });

  it('returns undefined when neither status nor a usable progressdetails is present', () => {
    expect(resolveViewReadStatus({ contentId: 'do_x' })).toBeUndefined();
    expect(resolveViewReadStatus({ contentId: 'do_x', progressdetails: 'not json' })).toBeUndefined();
    expect(resolveViewReadStatus(undefined)).toBeUndefined();
  });
});

describe('extractProgressDetailsValue', () => {
  it('parses the JSON-encoded progressdetails string (real payload shape)', () => {
    const item = findViewReadItem(getViewReadItems(LIVE_RESPONSE), 'do_2146344654141276161136');
    expect(extractProgressDetailsValue(item)).toBe(100);
  });

  it('returns undefined for missing or malformed progressdetails', () => {
    expect(extractProgressDetailsValue({ contentId: 'do_x' })).toBeUndefined();
    expect(extractProgressDetailsValue({ contentId: 'do_x', progressdetails: '{not valid json' })).toBeUndefined();
    expect(extractProgressDetailsValue({ contentId: 'do_x', progressdetails: '{"other":1}' })).toBeUndefined();
  });
});

describe('isIndividualScopeRecord', () => {
  it('detects the design doc\'s "individual content, no collection context" scope (real payload matches it)', () => {
    const item = findViewReadItem(getViewReadItems(LIVE_RESPONSE), 'do_2146344654141276161136');
    expect(isIndividualScopeRecord(item)).toBe(true);
  });

  it('returns false for a properly collection/context-scoped record', () => {
    expect(
      isIndividualScopeRecord({ contentId: 'do_x', courseId: 'do_course', batchId: 'batch_1:do_course' })
    ).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isIndividualScopeRecord(undefined)).toBe(false);
  });
});
