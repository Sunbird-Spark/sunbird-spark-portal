import { getClient } from '../../lib/http-client';
import type { LearnerProgressApiItem } from '../../types/reports';

export interface LearnerProgressResult {
  data: LearnerProgressApiItem[];
  /** Server-authoritative total enrolment count */
  count: number;
}

export class ObservabilityService {
  /**
   * Fetch detailed learner progress for a given course and batch.
   * POST /observability/v1/reports
   */
  public getLearnerProgress(
    courseId: string,
    batchId: string
  ): Promise<LearnerProgressResult> {
    return getClient()
      .post<unknown>('/observability/v1/reports', {
        request: {
          reportId: 'course-batch-enrolments',
          filters: {
            courseid: courseId,
            batchid: batchId,
          },
          transform: ['userid'],
        },
      })
      .then((response) => {
        const raw = response.data;
        // Plain array
        if (Array.isArray(raw)) return { data: raw as LearnerProgressApiItem[], count: (raw as unknown[]).length };
        if (raw !== null && typeof raw === 'object') {
          const asObj = raw as Record<string, unknown>;
          // { response: { data: [...], count: N } }  ← actual Sunbird shape
          const inner = asObj['response'];
          if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
            const innerObj = inner as Record<string, unknown>;
            const data = Array.isArray(innerObj['data']) ? (innerObj['data'] as LearnerProgressApiItem[]) : [];
            const count = typeof innerObj['count'] === 'number' ? innerObj['count'] : data.length;
            return { data, count };
          }
          // { response: [...] }  ← fallback
          if (Array.isArray(inner)) return { data: inner as LearnerProgressApiItem[], count: (inner as unknown[]).length };
        }
        return { data: [], count: 0 };
      });
  }
}

export const observabilityService = new ObservabilityService();
