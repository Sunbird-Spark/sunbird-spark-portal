import { getClient } from '../lib/http-client';

interface ContextDetails {
  contentId: string;
  contentVer: string;
  contentType: string;
  stageId?: string;
}

interface CreateCommentRequest {
  contextDetails: ContextDetails;
  body: string;
  userId: string;
  userInfo: {
    name: string;
    logo?: string;
  };
}

interface Comment {
  identifier: string;
  comment: string;
  createdBy: string;
  createdOn: string;
  stageId?: string;
  userId?: string;
}

export class ReviewCommentService {
  private baseUrl = '/review/comment/v1';

  async createComment(request: CreateCommentRequest) {
    const response = await getClient().post<{
      created: string;
      threadId: string;
    }>(`${this.baseUrl}/create/comment`, { request });
    return response.data;
  }

  async readComments(contextDetails: ContextDetails) {
    const response = await getClient().post<{
      comments: Comment[];
    }>(`${this.baseUrl}/read/comment`, { request: { contextDetails } });
    return response.data;
  }

  async deleteComments(contextDetails: ContextDetails) {
    const response = await getClient().post<{
      deleted: string;
    }>(`${this.baseUrl}/delete/comment`, { request: { contextDetails } });
    return response.data;
  }

  async hasComments(contextDetails: ContextDetails): Promise<boolean> {
    try {
      const response = await this.readComments(contextDetails);
      return (response.comments?.length || 0) > 0;
    } catch (error) {
      console.error('Failed to check for comments:', error);
      return false;
    }
  }
}

export default new ReviewCommentService();

export type { ContextDetails, CreateCommentRequest, Comment };
