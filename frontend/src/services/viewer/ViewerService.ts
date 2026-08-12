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
 * backend at `/portal/v1/...`.
 *
 * Confirmed route list (method + path), superseding the design doc's naming
 * where they diverge:
 *   POST   /v1/view/start
 *   POST   /v1/view/update
 *   POST   /v1/assessment/submit   (NOT /v1/view/assess - that route 404s)
 *   POST   /v1/view/end
 *   POST   /v1/view/read
 *   POST   /v1/assessment/read
 *   GET    /v1/summary/list/:userId
 *   POST   /v1/summary/read
 *   DELETE /v1/summary/delete/:userId       (?all=true for every enrolment, else a specific one)
 *   GET    /v1/summary/download/:userId     (?format=csv)
 */
export class ViewerService {
  public viewStart(request: ViewRequest): Promise<ApiResponse<unknown>> {
    return getClient().post('/v1/view/start', { request });
  }

  public viewUpdate(request: ViewUpdateRequest): Promise<ApiResponse<unknown>> {
    return getClient().post('/v1/view/update', { request });
  }

  /** Submits assessment events. */
  public viewAssess(request: ViewAssessRequest): Promise<ApiResponse<unknown>> {
    return getClient().post('/v1/assessment/submit', { request });
  }

  public viewEnd(request: ViewRequest): Promise<ApiResponse<unknown>> {
    return getClient().post('/v1/view/end', { request });
  }

  public viewRead(request: ViewReadRequest): Promise<ApiResponse<ViewReadResponse>> {
    return getClient().post<ViewReadResponse>('/v1/view/read', { request });
  }

  public assessmentRead(
    request: ViewReadRequest
  ): Promise<ApiResponse<AssessmentReadResponse>> {
    return getClient().post<AssessmentReadResponse>('/v1/assessment/read', { request });
  }

  public summaryList(userId: string): Promise<ApiResponse<ViewerSummaryListResponse>> {
    return getClient().get<ViewerSummaryListResponse>(`/v1/summary/list/${userId}`);
  }

  public summaryRead(request: {
    userId: string;
    collectionId: string;
    contextId: string;
  }): Promise<ApiResponse<ViewerSummaryReadResponse>> {
    return getClient().post<ViewerSummaryReadResponse>('/v1/summary/read', { request });
  }

  public summaryDelete({ userId, all, collectionId, contextId }: SummaryDeleteParams): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams();
    if (all) params.set('all', 'true');
    if (collectionId) params.set('collectionId', collectionId);
    if (contextId) params.set('contextId', contextId);
    const query = params.toString();
    return getClient().delete(`/v1/summary/delete/${userId}${query ? `?${query}` : ''}`);
  }

  public summaryDownload(userId: string, format?: string): Promise<ApiResponse<SummaryDownloadResponse>> {
    const query = format ? `?format=${encodeURIComponent(format)}` : '';
    return getClient().get<SummaryDownloadResponse>(`/v1/summary/download/${userId}${query}`);
  }
}
