import { describe, it, expect } from 'vitest';
import {
  calculateContentProgress,
  progressToStatus,
  type ConsumptionSummary,
} from './contentProgressCalculator';

describe('contentProgressCalculator', () => {
  describe('calculateContentProgress', () => {
    it('returns 0 for empty summary array', () => {
      expect(calculateContentProgress([], 'video/mp4')).toBe(0);
    });

    it('returns 0 when summary has no progress', () => {
      expect(
        calculateContentProgress([{ visitedLength: 10, totalLength: 100 }], 'video/mp4')
      ).toBe(0);
    });

    it('returns 100 for playback mime when endpageseen is true', () => {
      expect(
        calculateContentProgress(
          [{ progress: 50, endpageseen: true }],
          'video/mp4'
        )
      ).toBe(100);
    });

    it('returns 100 for playback mime when progress is 0 but endpageseen is true', () => {
      expect(
        calculateContentProgress(
          [{ progress: 0, endpageseen: true }],
          'video/mp4'
        )
      ).toBe(100);
    });

    it('returns 100 for playback mime when visitedcontentend is true', () => {
      expect(
        calculateContentProgress(
          [{ progress: 30, visitedcontentend: true }],
          'application/pdf'
        )
      ).toBe(100);
    });

    it('returns 100 for playback mime when viewed more than 20%', () => {
      expect(
        calculateContentProgress(
          [{ progress: 15, visitedLength: 25, totalLength: 100 }],
          'video/mp4'
        )
      ).toBe(100);
    });

    it('returns progress for playback mime when under 20% and no end seen', () => {
      expect(
        calculateContentProgress(
          [{ progress: 10, visitedLength: 5, totalLength: 100 }],
          'video/mp4'
        )
      ).toBe(10);
    });

    it('merges Sunbird-style array of single-key objects', () => {
      const summary: ConsumptionSummary[] = [
        { progress: 80 },
        { visitedlength: 40 },
        { totallength: 50 },
      ];
      expect(calculateContentProgress(summary, 'video/mp4')).toBe(100);
    });

    it('returns 100 for other mime (h5p/html archive) when progress >= 0', () => {
      expect(calculateContentProgress([{ progress: 1 }], 'application/vnd.ekstep.h5p-archive')).toBe(100);
      expect(calculateContentProgress([{ progress: 0 }], 'application/vnd.ekstep.html-archive')).toBe(100);
      expect(calculateContentProgress([{ progress: 50 }], 'application/vnd.ekstep.h5p-archive')).toBe(100);
    });

    it('returns 0 for other mime when progress is negative or NaN', () => {
      expect(calculateContentProgress([{ progress: -1 }], 'text/html')).toBe(0);
    });

    it('returns 100 for rest mime when progress >= 100', () => {
      expect(calculateContentProgress([{ progress: 100 }], 'application/unknown')).toBe(100);
    });

    it('returns 0 for rest mime when progress < 100', () => {
      expect(calculateContentProgress([{ progress: 99 }], 'application/unknown')).toBe(0);
    });

    it('handles video/x-youtube and application/epub as playback', () => {
      expect(
        calculateContentProgress(
          [{ progress: 10, endpageseen: true }],
          'video/x-youtube'
        )
      ).toBe(100);
      expect(
        calculateContentProgress(
          [{ progress: 10, endpageseen: true }],
          'application/epub'
        )
      ).toBe(100);
    });
  });

  describe('progressToStatus', () => {
    it('returns 0 for zero progress', () => {
      expect(progressToStatus(0)).toBe(0);
    });

    it('returns 1 for progress greater than 0 and less than 100', () => {
      expect(progressToStatus(0.1)).toBe(1);
      expect(progressToStatus(50)).toBe(1);
      expect(progressToStatus(99)).toBe(1);
    });

    it('returns 2 for progress 100 or more', () => {
      expect(progressToStatus(100)).toBe(2);
      expect(progressToStatus(150)).toBe(2);
    });
  });
});
