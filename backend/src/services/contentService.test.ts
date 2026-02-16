import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { searchContent } from './contentService.js';
import logger from '../utils/logger.js';

// Mocks
vi.mock('axios');
vi.mock('../config/env.js', () => ({
  envConfig: {
    LEARN_BASE_URL: 'http://learn-service',
  },
}));
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAxios = vi.mocked(axios);
const mockLogger = vi.mocked(logger);

describe('ContentService - searchContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultFilters = {
    primaryCategory: [
      "Collection", "Resource", "Content Playlist",
      "Course", "Course Assessment", "Digital Textbook",
      "eTextbook", "Explanation Content", "Learning Resource",
      "Lesson Plan Unit", "Practice Question Set", "Teacher Resource",
      "Textbook Unit", "LessonPlan", "FocusSpot",
      "Learning Outcome Definition", "Curiosity Questions",
      "MarkingSchemeRubric", "ExplanationResource", "ExperientialResource",
      "Practice Resource", "TVLesson", "Course Unit",
      "Exam Question", "Question paper"
    ],
    visibility: ["Default", "Parent"],
  };

  const defaultFields = [
    "name", "appIcon", "mimeType", "gradeLevel", "identifier",
    "medium", "pkgVersion", "board", "subject", "resourceType",
    "primaryCategory", "contentType", "channel", "organisation", "trackable", "lastUpdatedOn",
    "leafNodesCount"
  ];

  it('should construct payload with default values', async () => {
    (mockAxios.post as any).mockResolvedValue({ data: { result: { count: 0, content: [] } } });

    await searchContent({});

    expect(mockAxios.post).toHaveBeenCalledWith(
      'http://learn-service/content/v1/search?orgdetails=orgName,email',
      {
        request: {
          query: "",
          filters: defaultFilters,
          limit: 100,
          sort_by: { lastPublishedOn: "desc" },
          fields: defaultFields,
          mode: "soft",
          offset: 0
        }
      },
      expect.any(Object)
    );
  });

  it('should merge custom filters with default filters', async () => {
    (mockAxios.post as any).mockResolvedValue({ data: { result: { count: 0, content: [] } } });

    const customFilters = {
      contentType: ["Course"],
      visibility: ["Public"] // Overriding default visibility
    };

    await searchContent(customFilters);

    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        request: expect.objectContaining({
          filters: expect.objectContaining({
            primaryCategory: defaultFilters.primaryCategory,
            visibility: ["Public"],
            contentType: ["Course"]
          })
        })
      }),
      expect.any(Object)
    );
  });

  it('should use provided limit, offset, query and sort_by', async () => {
    (mockAxios.post as any).mockResolvedValue({ data: { result: { count: 0, content: [] } } });

    const limit = 50;
    const offset = 10;
    const query = "test query";
    const sortBy = { name: "asc" } as const;

    await searchContent({}, limit, offset, query, sortBy);

    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        request: expect.objectContaining({
          limit,
          offset,
          query,
          sort_by: sortBy
        })
      }),
      expect.any(Object)
    );
  });

  it('should return response data on success', async () => {
    const mockResponse = { result: { count: 1, content: [{ identifier: '123' }] } };
    (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

    const result = await searchContent({});

    expect(result).toEqual(mockResponse.result);
    expect(mockLogger.info).toHaveBeenCalled(); // Should assume success logging
  });

  it('should propagate error and log it on failure', async () => {
    const error = new Error('Network Error');
    (mockAxios.post as any).mockRejectedValue(error);

    await expect(searchContent({})).rejects.toThrow('Network Error');

    expect(mockLogger.error).toHaveBeenCalledWith('Error searching content:', error);
  });
});
