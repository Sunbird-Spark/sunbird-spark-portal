import { getClient, ApiResponse } from '../../lib/http-client';
import type {
  PassbookReadResponse,
  GapReadResponse,
  CompetencyFrameworkReadResponse,
} from '../../types/competencyServiceTypes';

/**
 * Thin client over the Viewer Service's competency APIs. Proxied through the
 * backend at `/portal/...`, which forwards to Kong, exactly like
 * `services/viewer/ViewerService.ts`.
 *
 * ROUTING: Kong exposes `<COMPETENCY>/...` and rewrites onto the service's own
 * `/v1/competency/...`. The prefix lives in one constant so a Helm-side change
 * is a one-line edit.
 *
 *   POST /competency/v1/passbook/read
 *   POST /competency/v1/gap/read
 *   POST /competency/v1/position/update
 *   GET  /competency/v1/framework/read/:frameworkId
 *
 * `/competency/v1/recommend` also exists but is not wired up: it returns
 * competency CODES rather than content, and the code -> Learning Path mapping is
 * unspecified. Do not call it speculatively.
 *
 * NO userId IN THE BODY. Every learner-facing operation reads the user from the
 * auth token (`CompetencyController.authUserId`); sending one is ignored at
 * best and misleading at worst.
 */
const COMPETENCY = '/competency/v1';

export class CompetencyService {
  /**
   * The learner's held competencies. `evidence: true` expands the supporting
   * rows, which is what the UI needs to answer "what proved this?".
   */
  public passbookRead(options?: { evidence?: boolean }): Promise<ApiResponse<PassbookReadResponse>> {
    return getClient().post<PassbookReadResponse>(`${COMPETENCY}/passbook/read`, {
      request: { evidence: options?.evidence ?? false },
    });
  }

  /**
   * Readiness against a position. `position` and `frameworkId` are passed
   * explicitly rather than relying on the learner's stored assignment:
   * `user_competency_position` is only written by an HR feed or
   * `position/update`, and with neither set the service answers
   * `readiness: 0` with an empty gap - which means "no position", not "0%".
   */
  public gapRead(request: { frameworkId: string; position: string }): Promise<ApiResponse<GapReadResponse>> {
    return getClient().post<GapReadResponse>(`${COMPETENCY}/gap/read`, { request });
  }

  /**
   * Saves the learner's chosen target positions. `currentPosition` is dropped
   * server-side on this route by design - who a learner reports as is an
   * assignment, not a preference - so only targets can be set here.
   */
  public updateTargetPositions(request: {
    frameworkId: string;
    targetPositions: string[];
  }): Promise<ApiResponse<unknown>> {
    return getClient().post(`${COMPETENCY}/position/update`, { request });
  }

  /** The resolved framework: the level scale and the requirement matrix per position. */
  public frameworkRead(frameworkId: string): Promise<ApiResponse<CompetencyFrameworkReadResponse>> {
    return getClient().get<CompetencyFrameworkReadResponse>(
      `${COMPETENCY}/framework/read/${encodeURIComponent(frameworkId)}`
    );
  }
}
