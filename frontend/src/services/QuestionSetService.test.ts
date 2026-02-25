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
      patch: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
    service = new QuestionSetService();
  });

  describe('getHierarchy', () => {
    it('should call client.get with correct url', async () => {
      const hierarchyData = {
        questionset: {
          identifier: 'do_123',
          name: 'Test QuestionSet',
          children: []
        }
      };
      const mockResponse = { data: hierarchyData, status: 200, headers: {} };
      mockClient.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getHierarchy('do_123');

      expect(mockClient.get).toHaveBeenCalledWith('/questionset/v2/hierarchy/do_123');
      expect(result).toEqual(hierarchyData);
    });

    it('should handle errors', async () => {
      mockClient.get = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.getHierarchy('do_123')).rejects.toThrow('Network error');
    });
  });

  describe('getQuestionset', () => {
    it('should call client.get with correct url', async () => {
      const questionsetData = {
        questionset: {
          identifier: 'do_123',
          outcomeDeclaration: {
            maxScore: {
              defaultValue: 1
            }
          }
        }
      };
      const mockResponse = { data: questionsetData, status: 200, headers: {} };
      mockClient.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getQuestionset('do_123');

      expect(mockClient.get).toHaveBeenCalledWith('/questionset/v2/read/do_123?mode=edit');
      expect(result).toEqual(questionsetData);
    });

    it('should handle errors', async () => {
      mockClient.get = vi.fn().mockRejectedValue(new Error('Not found'));

      await expect(service.getQuestionset('do_123')).rejects.toThrow('Not found');
    });
  });

  describe('getQuestionList', () => {
    it('should call client.post with correct url and payload', async () => {
      const identifiers = ['do_q1', 'do_q2', 'do_q3'];
      const listData = {
        questions: [
          { identifier: 'do_q1', body: '<p>Question 1</p>' },
          { identifier: 'do_q2', body: '<p>Question 2</p>' },
          { identifier: 'do_q3', body: '<p>Question 3</p>' }
        ],
        count: 3
      };
      const mockResponse = { data: listData, status: 200, headers: {} };
      mockClient.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getQuestionList(identifiers);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/question/v2/list',
        { request: { search: { identifier: identifiers } } }
      );
      expect(result).toEqual(listData);
    });

    it('should handle empty identifiers array', async () => {
      const listData = { questions: [], count: 0 };
      const mockResponse = { data: listData, status: 200, headers: {} };
      mockClient.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.getQuestionList([]);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/question/v2/list',
        { request: { search: { identifier: [] } } }
      );
      expect(result).toEqual(listData);
    });

    it('should handle errors', async () => {
      mockClient.post = vi.fn().mockRejectedValue(new Error('API error'));

      await expect(service.getQuestionList(['do_q1'])).rejects.toThrow('API error');
    });
  });

  describe('createQuestionSet', () => {
    const createOptions = {
      name: 'Practice Set 1',
      createdBy: 'user-123',
      createdFor: ['org-456'],
      framework: 'NCF',
    };

    it('should call client.post with correct url and payload structure', async () => {
      const mockUuid = 'generated-uuid-123';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn().mockReturnValue(mockUuid),
      });

      const createData = { identifier: 'do_qs_789', versionKey: 'vk_abc' };
      const mockResponse = { data: createData, status: 200, headers: {} };
      mockClient.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.createQuestionSet(createOptions);

      expect(mockClient.post).toHaveBeenCalledWith('/questionset/v2/create', {
        request: {
          questionset: {
            name: createOptions.name,
            mimeType: 'application/vnd.sunbird.questionset',
            primaryCategory: 'Practice Question Set',
            createdBy: createOptions.createdBy,
            createdFor: createOptions.createdFor,
            framework: createOptions.framework,
            code: mockUuid,
          },
        },
      });
      expect(result).toEqual(createData);
    });

    it('should include generated UUID in payload', async () => {
      const mockUuid = 'unique-uuid-xyz';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn().mockReturnValue(mockUuid),
      });

      mockClient.post = vi.fn().mockResolvedValue({
        data: { identifier: 'do_new' },
      });

      await service.createQuestionSet(createOptions);

      const callArgs = (mockClient.post as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs).toBeDefined();
      const callPayload = callArgs![1] as { request: { questionset: { code: string } } };
      expect(callPayload.request.questionset.code).toBe(mockUuid);
    });

    it('should return identifier and versionKey from API response', async () => {
      vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue('uuid') });
      const createData = { identifier: 'do_qs_new_123', versionKey: 'version_key_456' };
      mockClient.post = vi.fn().mockResolvedValue({ data: createData });

      const result = await service.createQuestionSet(createOptions);

      expect(result).toEqual(createData);
    });

    it('should handle errors', async () => {
      mockClient.post = vi.fn().mockRejectedValue(new Error('Create failed'));

      await expect(service.createQuestionSet(createOptions)).rejects.toThrow('Create failed');
    });
  });

  describe('retireQuestionSet', () => {
    it('should call client.delete with correct url and payload', async () => {
      const questionSetId = 'do_qs_123';
      const retireData = { identifier: questionSetId, status: 'Retired' };
      const mockResponse = { data: retireData, status: 200, headers: {} };
      mockClient.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.retireQuestionSet(questionSetId);

      expect(mockClient.delete).toHaveBeenCalledWith(
        `/questionset/v2/retire/${questionSetId}`,
        { request: { questionset: {} } }
      );
      expect(result).toEqual(retireData);
    });

    it('should handle errors', async () => {
      const questionSetId = 'do_qs_123';
      mockClient.delete = vi.fn().mockRejectedValue(new Error('Retire failed'));

      await expect(service.retireQuestionSet(questionSetId)).rejects.toThrow('Retire failed');
    });
  });
});
