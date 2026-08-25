import { getClient, ApiResponse } from '../../lib/http-client';
import type {
  ViewRequest,
  ViewUpdateRequest,
  ViewAssessRequest,
  ViewReadRequest,
  ViewReadResponse,
  AssessmentReadResponse,
  ViewerSummaryListResponse,
  ViewerSummaryReadResponse,
  SummaryDeleteParams,
  SummaryDownloadResponse,
} from '../../types/viewerServiceTypes';

/**
 * Thin client over the Viewer Service: granular view-lifecycle APIs and
 * summary APIs that replace the legacy content/state/read|update +
 * enrollment/list triad for Learning Path consumption. Proxied through the
 * backend at `/portal/...`, which forwards to Kong.
 *
 * WIRE NAMING: the portal speaks `collectionId`/`contextId` internally (the
 * design doc's names), but the service reads ONLY `courseId`/`batchId` -
 * `ViewerRequestKeys.scala` is explicit that "legacy-key resolution is the
 * caller's job (no fallback here)". Sending `collectionId`/`contextId` made
 * `ViewConsumptionActor.viewKey` cascade both to `contentId`, so every row
 * landed under the "individual content, no collection context" scope: the
 * enrolment was never stamped and the rollup found no leaf nodes, which is why
 * Learning Path progress never saved or resumed. `toWireIds` below is the
 * single write-side translation point, mirroring what `summaryMapper.ts` does
 * for the response direction.
 *
 * ROUTING: these are the Kong-fronted URIs (`<prefix>/v1/<verb>`), which Kong
 * rewrites to the service's own `/v1/<resource>/<verb>`. The prefixes live in
 * the three constants below so a Helm-side prefix change is a one-line edit
 * here. Previously the portal called the service's raw paths directly via a
 * dedicated `viewerProxy`; that proxy is gone and everything now goes through
 * `kongProxy` like every other API in the portal.
 *
 * Confirmed route list (method + path), superseding the design doc's naming
 * where they diverge:
 *   POST   /view/v1/start
 *   POST   /view/v1/update
 *   POST   /assessment/v1/submit    (NOT /view/v1/assess - that route 404s)
 *   POST   /view/v1/end
 *   POST   /view/v1/read
 *   POST   /assessment/v1/read
 *   GET    /summary/v1/list/:userId
 *   POST   /summary/v1/read
 *   DELETE /summary/v1/delete/:userId       (?all=true for every enrolment, else a specific one)
 *   GET    /summary/v1/download/:userId     (?format=csv)
 *
 * Kong also exposes `/view/v1/agg`. The portal does not call it and its purpose
 * is unconfirmed - do not wire it up speculatively.
 */

/**
 * Kong route prefixes (Helm `view_prefix` / `assessment_prefix` /
 * `summary_prefix`). Kong maps `<prefix>/v1/<verb>` onto the Viewer Service's
 * own `/v1/<resource>/<verb>`.
 */
const VIEW = '/view/v1';
const ASSESSMENT = '/assessment/v1';
const SUMMARY = '/summary/v1';

/** Drops `collectionId`/`contextId` and emits `courseId`/`batchId` - the only keys
 * `ViewerRequestKeys.scala` reads. Blank/undefined values are omitted so the
 * actor's own cascade (courseId <- contentId, batchId <- courseId <- contentId)
 * still applies exactly as designed. */
function toWireIds<T extends { collectionId?: string; contextId?: string }>(
  request: T
): Omit<T, 'collectionId' | 'contextId'> & { courseId?: string; batchId?: string } {
  const { collectionId, contextId, ...rest } = request;
  return {
    ...rest,
    ...(collectionId ? { courseId: collectionId } : {}),
    ...(contextId ? { batchId: contextId } : {}),
  };
}

export class ViewerService {
  public viewStart(request: ViewRequest): Promise<ApiResponse<unknown>> {
    return getClient().post(`${VIEW}/start`, { request: toWireIds(request) });
  }

  public viewUpdate(request: ViewUpdateRequest): Promise<ApiResponse<unknown>> {
    return getClient().post(`${VIEW}/update`, { request: toWireIds(request) });
  }

  /** Submits assessment events. */
  public viewAssess(request: ViewAssessRequest): Promise<ApiResponse<unknown>> {
    return getClient().post(`${ASSESSMENT}/submit`, { request: toWireIds(request) });
  }

  public viewEnd(request: ViewRequest): Promise<ApiResponse<unknown>> {
    return getClient().post(`${VIEW}/end`, { request: toWireIds(request) });
  }

  public viewRead(request: ViewReadRequest): Promise<ApiResponse<ViewReadResponse>> {
    return getClient().post<ViewReadResponse>(`${VIEW}/read`, { request: toWireIds(request) });
  }

  public assessmentRead(
    request: ViewReadRequest
  ): Promise<ApiResponse<AssessmentReadResponse>> {
    return getClient().post<AssessmentReadResponse>(`${ASSESSMENT}/read`, { request: toWireIds(request) });
  }

  public summaryList(userId: string): Promise<ApiResponse<ViewerSummaryListResponse>> {
    return getClient().get<ViewerSummaryListResponse>(`${SUMMARY}/list/${userId}`);
  }

  public summaryRead(request: {
    userId: string;
    collectionId: string;
    contextId: string;
  }): Promise<ApiResponse<ViewerSummaryReadResponse>> {
    return getClient().post<ViewerSummaryReadResponse>(`${SUMMARY}/read`, { request: toWireIds(request) });
  }

  public summaryDelete({ userId, all, collectionId, contextId }: SummaryDeleteParams): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams();
    if (all) params.set('all', 'true');
    if (collectionId) params.set('courseId', collectionId);
    if (contextId) params.set('batchId', contextId);
    const query = params.toString();
    return getClient().delete(`${SUMMARY}/delete/${userId}${query ? `?${query}` : ''}`);
  }

  public summaryDownload(userId: string, format?: string): Promise<ApiResponse<SummaryDownloadResponse>> {
    const query = format ? `?format=${encodeURIComponent(format)}` : '';
    return getClient().get<SummaryDownloadResponse>(`${SUMMARY}/download/${userId}${query}`);
  }
}
