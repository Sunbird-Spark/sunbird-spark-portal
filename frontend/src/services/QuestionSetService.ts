import { getClient } from '../lib/http-client';

export class QuestionSetService {
  async getHierarchy<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<T>(`/questionset/v2/hierarchy/${questionSetId}`);
    return res.data;
  }

  async getQuestionset<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<T>(`/questionset/v2/read/${questionSetId}`);
    return res.data;
  }

  async getQuestionList<T = any>(identifiers: string[]): Promise<T> {
    const payload = { request: { search: { identifier: identifiers } } };
    const res = await getClient().post<T>(`/question/v2/list`, payload);
    return res.data;
  }
}

export const questionSetService = new QuestionSetService();