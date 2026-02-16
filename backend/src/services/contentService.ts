import axios from 'axios';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';

export const searchContent = async (filters: any, limit: number = 100, offset: number = 0, query?: string, sort_by?: any) => {
  try {
    const searchUrl = `${envConfig.LEARN_BASE_URL}/content/v1/search?orgdetails=orgName,email`;
    
    // Default filters as per requirements
    const requestBody = {
      request: {
        query: query || "",
        filters: {
          primaryCategory: [
            "Collection","Resource","Content Playlist",
            "Course","Course Assessment","Digital Textbook",
            "eTextbook","Explanation Content","Learning Resource",
            "Lesson Plan Unit","Practice Question Set","Teacher Resource",
            "Textbook Unit","LessonPlan","FocusSpot",
            "Learning Outcome Definition","Curiosity Questions",
            "MarkingSchemeRubric","ExplanationResource","ExperientialResource",
            "Practice Resource","TVLesson","Course Unit",
            "Exam Question","Question paper"
          ],
          visibility: ["Default", "Parent"],
          ...filters // Allow overriding or adding filters
        },
        limit: limit,
        sort_by: sort_by || {
          lastPublishedOn: "desc"
        },
        fields: [
          "name", "appIcon", "mimeType", "gradeLevel", "identifier",
          "medium", "pkgVersion", "board", "subject", "resourceType",
          "primaryCategory", "contentType", "channel", "organisation", "trackable", "lastUpdatedOn",
          "leafNodesCount"
        ],
        mode: "soft",
        offset: offset
      }
    };

    // Log the request details - can be removed in production
    logger.info(`Searching content at ${searchUrl} with limit=${limit}, offset=${offset}`);
    logger.info(`Request body: ${JSON.stringify(requestBody, null, 2)}`);
    
    const response = await axios.post(searchUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });
    logger.info(`Received ${response.data?.result?.count || 0} total results, ${response.data?.result?.content?.length || 0} items in this batch`);
    return response.data;
  } catch (error) {
    logger.error('Error searching content:', error);
    throw error;
  }
};
