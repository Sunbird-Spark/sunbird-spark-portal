import { ViewerService } from './ViewerService';

export { ViewerService };
export const viewerService = new ViewerService();

export {
  normaliseSummaryRecords,
  normaliseSummaryReadRecord,
  indexSummaryByCollectionId,
  getPathSummary,
  buildCourseContextId,
  getCourseContextId,
  parseCourseContextId,
} from './summaryMapper';
