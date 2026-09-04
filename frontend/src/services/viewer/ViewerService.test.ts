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
 *   POST   /view/v1/start
 *   POST   /view/v1/update
 *   POST   /assessment/v1/submit   (NOT /view/v1/assess - that route 404s)
 *   POST   /view/v1/end
 *   POST   /view/v1/read
 *   POST   /assessment/v1/read
 *   GET    /summary/v1/list/:userId
 *   POST   /summary/v1/read
 *   DELETE /summary/v1/delete/:userId
 *   GET    /summary/v1/download/:userId
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

  it('viewStart posts to /view/v1/start with collectionId/contextId translated to courseId/batchId', async () => {
    const request = { userId: 'u1', contentId: 'do_1', collectionId: 'do_c', contextId: 'batch_1' };
    await service.viewStart(request);
    expect(mockPost).toHaveBeenCalledWith('/view/v1/start', {
      request: { userId: 'u1', contentId: 'do_1', courseId: 'do_c', batchId: 'batch_1' },
    });
  });

  it('viewUpdate posts to /view/v1/update without collectionId/contextId when absent', async () => {
    const request = { userId: 'u1', contentId: 'do_1', progressDetails: { progress: 50 }, timespent: 12.63 };
    await service.viewUpdate(request);
    expect(mockPost).toHaveBeenCalledWith('/view/v1/update', { request });
  });

  it('viewAssess posts to /assessment/v1/submit (not /view/v1/assess) with courseId/batchId', async () => {
    const request = {
      userId: 'u1',
      contentId: 'do_1',
      collectionId: 'do_c',
      contextId: 'batch_1',
      assessments: [{ eid: 'ASSESS' }],
      attemptId: 'attempt-1',
      assessmentTs: 1700000000000,
      score: 3,
      maxScore: 5,
    };
    await service.viewAssess(request);
    expect(mockPost).toHaveBeenCalledWith('/assessment/v1/submit', {
      request: {
        userId: 'u1',
        contentId: 'do_1',
        courseId: 'do_c',
        batchId: 'batch_1',
        assessments: [{ eid: 'ASSESS' }],
        attemptId: 'attempt-1',
        assessmentTs: 1700000000000,
        score: 3,
        maxScore: 5,
      },
    });
  });

  it('viewEnd posts to /view/v1/end', async () => {
    const request = { userId: 'u1', contentId: 'do_1' };
    await service.viewEnd(request);
    expect(mockPost).toHaveBeenCalledWith('/view/v1/end', { request });
  });

  it('viewRead posts to /view/v1/read with courseId/batchId', async () => {
    const request = { userId: 'u1', contentId: ['do_1', 'do_2'], collectionId: 'do_c', contextId: 'batch_1' };
    await service.viewRead(request);
    expect(mockPost).toHaveBeenCalledWith('/view/v1/read', {
      request: { userId: 'u1', contentId: ['do_1', 'do_2'], courseId: 'do_c', batchId: 'batch_1' },
    });
  });

  it('assessmentRead posts to /assessment/v1/read', async () => {
    const request = { userId: 'u1', contentId: ['do_1'] };
    await service.assessmentRead(request);
    expect(mockPost).toHaveBeenCalledWith('/assessment/v1/read', { request });
  });

  it('summaryList gets /summary/v1/list/:userId', async () => {
    await service.summaryList('u1');
    expect(mockGet).toHaveBeenCalledWith('/summary/v1/list/u1');
  });

  it('summaryRead posts to /summary/v1/read with courseId/batchId, not collectionId/contextId', async () => {
    const request = { userId: 'u1', collectionId: 'do_lp', contextId: 'batch_1' };
    await service.summaryRead(request);
    expect(mockPost).toHaveBeenCalledWith('/summary/v1/read', {
      request: { userId: 'u1', courseId: 'do_lp', batchId: 'batch_1' },
    });
  });

  it('summaryDelete DELETEs /summary/v1/delete/:userId with ?all=true for every enrolment', async () => {
    await service.summaryDelete({ userId: 'u1', all: true });
    expect(mockDelete).toHaveBeenCalledWith('/summary/v1/delete/u1?all=true');
  });

  it('summaryDelete DELETEs /summary/v1/delete/:userId with courseId/batchId for a specific enrolment', async () => {
    await service.summaryDelete({ userId: 'u1', collectionId: 'do_lp', contextId: 'batch_1' });
    expect(mockDelete).toHaveBeenCalledWith('/summary/v1/delete/u1?courseId=do_lp&batchId=batch_1');
  });

  it('summaryDelete DELETEs /summary/v1/delete/:userId with no query string when nothing else is specified', async () => {
    await service.summaryDelete({ userId: 'u1' });
    expect(mockDelete).toHaveBeenCalledWith('/summary/v1/delete/u1');
  });

  it('summaryDownload gets /summary/v1/download/:userId with a format query', async () => {
    await service.summaryDownload('u1', 'csv');
    expect(mockGet).toHaveBeenCalledWith('/summary/v1/download/u1?format=csv');
  });

  it('summaryDownload gets /summary/v1/download/:userId with no query when format is omitted', async () => {
    await service.summaryDownload('u1');
    expect(mockGet).toHaveBeenCalledWith('/summary/v1/download/u1');
  });
});
