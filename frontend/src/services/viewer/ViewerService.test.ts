import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ViewerService } from './ViewerService';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../lib/http-client', () => ({
  getClient: () => ({
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  }),
}));

/**
 * Locks in the confirmed Viewer Service route list (method + path), which in
 * a few places diverges from the design doc's naming:
 *   POST   /v1/view/start
 *   POST   /v1/view/update
 *   POST   /v1/assessment/submit   (NOT /v1/view/assess - that route 404s)
 *   POST   /v1/view/end
 *   POST   /v1/view/read
 *   POST   /v1/assessment/read
 *   GET    /v1/summary/list/:userId
 *   POST   /v1/summary/read
 *   DELETE /v1/summary/delete/:userId
 *   GET    /v1/summary/download/:userId
 *
 * Also locks in the wire-naming translation: the portal speaks
 * `collectionId`/`contextId` internally, but `ViewerRequestKeys.scala` reads
 * ONLY `courseId`/`batchId` ("no fallback here"). Every write below must send
 * `courseId`/`batchId` and must NOT send `collectionId`/`contextId` - sending
 * the latter is what silently broke Learning Path progress save/resume.
 */
describe('ViewerService', () => {
  let service: ViewerService;
  const okResponse = { data: {}, status: 200, headers: {} };

  beforeEach(() => {
    service = new ViewerService();
    mockGet.mockReset().mockResolvedValue(okResponse);
    mockPost.mockReset().mockResolvedValue(okResponse);
    mockDelete.mockReset().mockResolvedValue(okResponse);
  });

  it('viewStart posts to /v1/view/start with collectionId/contextId translated to courseId/batchId', async () => {
    const request = { userId: 'u1', contentId: 'do_1', collectionId: 'do_c', contextId: 'batch_1' };
    await service.viewStart(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/view/start', {
      request: { userId: 'u1', contentId: 'do_1', courseId: 'do_c', batchId: 'batch_1' },
    });
  });

  it('viewUpdate posts to /v1/view/update without collectionId/contextId when absent', async () => {
    const request = { userId: 'u1', contentId: 'do_1', progressDetails: { progress: 50 }, timespent: 12.63 };
    await service.viewUpdate(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/view/update', { request });
  });

  it('viewAssess posts to /v1/assessment/submit (not /v1/view/assess) with courseId/batchId', async () => {
    const request = {
      userId: 'u1',
      contentId: 'do_1',
      collectionId: 'do_c',
      contextId: 'batch_1',
      assessments: [{ eid: 'ASSESS' }],
    };
    await service.viewAssess(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/assessment/submit', {
      request: {
        userId: 'u1',
        contentId: 'do_1',
        courseId: 'do_c',
        batchId: 'batch_1',
        assessments: [{ eid: 'ASSESS' }],
      },
    });
  });

  it('viewEnd posts to /v1/view/end', async () => {
    const request = { userId: 'u1', contentId: 'do_1' };
    await service.viewEnd(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/view/end', { request });
  });

  it('viewRead posts to /v1/view/read with courseId/batchId', async () => {
    const request = { userId: 'u1', contentId: ['do_1', 'do_2'], collectionId: 'do_c', contextId: 'batch_1' };
    await service.viewRead(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/view/read', {
      request: { userId: 'u1', contentId: ['do_1', 'do_2'], courseId: 'do_c', batchId: 'batch_1' },
    });
  });

  it('assessmentRead posts to /v1/assessment/read', async () => {
    const request = { userId: 'u1', contentId: ['do_1'] };
    await service.assessmentRead(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/assessment/read', { request });
  });

  it('summaryList gets /v1/summary/list/:userId', async () => {
    await service.summaryList('u1');
    expect(mockGet).toHaveBeenCalledWith('/v1/summary/list/u1');
  });

  it('summaryRead posts to /v1/summary/read with courseId/batchId, not collectionId/contextId', async () => {
    const request = { userId: 'u1', collectionId: 'do_lp', contextId: 'batch_1' };
    await service.summaryRead(request);
    expect(mockPost).toHaveBeenCalledWith('/v1/summary/read', {
      request: { userId: 'u1', courseId: 'do_lp', batchId: 'batch_1' },
    });
  });

  it('summaryDelete DELETEs /v1/summary/delete/:userId with ?all=true for every enrolment', async () => {
    await service.summaryDelete({ userId: 'u1', all: true });
    expect(mockDelete).toHaveBeenCalledWith('/v1/summary/delete/u1?all=true');
  });

  it('summaryDelete DELETEs /v1/summary/delete/:userId with courseId/batchId for a specific enrolment', async () => {
    await service.summaryDelete({ userId: 'u1', collectionId: 'do_lp', contextId: 'batch_1' });
    expect(mockDelete).toHaveBeenCalledWith('/v1/summary/delete/u1?courseId=do_lp&batchId=batch_1');
  });

  it('summaryDelete DELETEs /v1/summary/delete/:userId with no query string when nothing else is specified', async () => {
    await service.summaryDelete({ userId: 'u1' });
    expect(mockDelete).toHaveBeenCalledWith('/v1/summary/delete/u1');
  });

  it('summaryDownload gets /v1/summary/download/:userId with a format query', async () => {
    await service.summaryDownload('u1', 'csv');
    expect(mockGet).toHaveBeenCalledWith('/v1/summary/download/u1?format=csv');
  });

  it('summaryDownload gets /v1/summary/download/:userId with no query when format is omitted', async () => {
    await service.summaryDownload('u1');
    expect(mockGet).toHaveBeenCalledWith('/v1/summary/download/u1');
  });
});
