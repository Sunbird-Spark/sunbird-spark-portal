import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionSetService } from './QuestionSetService';
import { IHttpClient, init } from '../lib/http-client';

describe('QuestionSetService', () => {
  let mockClient: IHttpClient;
  let service: QuestionSetService;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
    service = new QuestionSetService();
  });

  describe('getHierarchy', () => {
    it('should call client.get with correct url', async () => {
      const mockResponse = {
        data: {
          result: {
            questionset: {
              identifier: 'do_123',
              name: 'Test QuestionSet',
              children: []
            }
          }
        },
        status: 200,
        headers: {}
      };
      mockClient.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getHierarchy('do_123');

      expect(mockClient.get).toHaveBeenCalledWith('/questionset/v2/hierarchy/do_123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors', async () => {
      mockClient.get = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.getHierarchy('do_123')).rejects.toThrow('Network error');
    });
  });

  describe('getQuestionset', () => {
    it('should call client.get with correct url', async () => {
      const mockResponse = {
        data: {
          result: {
            questionset: {
              identifier: 'do_123',
              outcomeDeclaration: {
                maxScore: {
                  defaultValue: 1
                }
              }
            }
          }
        },
        status: 200,
        headers: {}
      };
      mockClient.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getQuestionset('do_123');

      expect(mockClient.get).toHaveBeenCalledWith('/questionset/v2/read/do_123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors', async () => {
      mockClient.get = vi.fn().mockRejectedValue(new Error('Not found'));

      await expect(service.getQuestionset('do_123')).rejects.toThrow('Not found');
    });
  });

  describe('getQuestionList', () => {
    it('should call client.post with correct url and payload', async () => {
      const identifiers = ['do_q1', 'do_q2', 'do_q3'];
      const mockResponse = {
        data: {
          result: {
            questions: [
              { identifier: 'do_q1', body: '<p>Question 1</p>' },
              { identifier: 'do_q2', body: '<p>Question 2</p>' },
              { identifier: 'do_q3', body: '<p>Question 3</p>' }
            ],
            count: 3
          }
        },
        status: 200,
        headers: {}
      };
      mockClient.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getQuestionList(identifiers);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/question/v2/list',
        { request: { search: { identifier: identifiers } } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty identifiers array', async () => {
      const mockResponse = {
        data: {
          result: {
            questions: [],
            count: 0
          }
        },
        status: 200,
        headers: {}
      };
      mockClient.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getQuestionList([]);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/question/v2/list',
        { request: { search: { identifier: [] } } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors', async () => {
      mockClient.post = vi.fn().mockRejectedValue(new Error('API error'));

      await expect(service.getQuestionList(['do_q1'])).rejects.toThrow('API error');
    });
  });
});