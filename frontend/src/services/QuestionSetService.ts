import { getClient } from '../lib/http-client';

export class QuestionSetService {
  async getHierarchy<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<T>(`/questionset/v2/hierarchy/${questionSetId}`);
    return res.data;
  }

  async getQuestionset<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<T>(`/questionset/v2/read/${questionSetId}?mode=edit`);
    return res.data;
  }

  async getQuestionList<T = any>(identifiers: string[]): Promise<T> {
    const payload = { request: { search: { identifier: identifiers } } };
    const res = await getClient().post<T>(`/question/v2/list`, payload);
    return res.data;
  }

  async createQuestionSet(options: {
    name: string;
    createdBy: string;
    createdFor: string[];
    framework: string;
  }): Promise<{identifier: string, versionKey?: string}> {
    const payload = {
      request: {
        questionset: {
          name: options.name,
          mimeType: 'application/vnd.sunbird.questionset',
          primaryCategory: 'Practice Question Set',
          createdBy: options.createdBy,
          createdFor: options.createdFor,
          framework: options.framework,
          code: crypto.randomUUID(),
        },
      },
    };
    const res = await getClient().post<any>('/questionset/v2/create', payload);
    return res.data;
  }
}

export const questionSetService = new QuestionSetService();