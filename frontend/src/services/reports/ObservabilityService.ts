import { getClient } from '../../lib/http-client';
import type { LearnerProgressApiItem } from '../../types/reports';

export interface LearnerProgressRequest {
  courseId: string;
  batchId: string;
}

export class ObservabilityService {
  /**
   * Fetch detailed learner progress for a given course and batch.
   * POST /observability/v1/reports
   */
  public getLearnerProgress(
    courseId: string,
    batchId: string
  ): Promise<LearnerProgressApiItem[]> {
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
        if (Array.isArray(raw)) return raw as LearnerProgressApiItem[];
        if (raw !== null && typeof raw === 'object') {
          const asObj = raw as Record<string, unknown>;
          // { response: { data: [...] } }  ← actual Sunbird shape
          const inner = asObj['response'];
          if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
            const innerObj = inner as Record<string, unknown>;
            if (Array.isArray(innerObj['data'])) return innerObj['data'] as LearnerProgressApiItem[];
          }
          // { response: [...] }  ← fallback
          if (Array.isArray(inner)) return inner as LearnerProgressApiItem[];
        }
        return [];
      });
  }
}

export const observabilityService = new ObservabilityService();
