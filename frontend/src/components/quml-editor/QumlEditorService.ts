import { getClient } from '../../lib/http-client';

export interface EditorConfig {
  context: {
    identifier: string;
    channel: string;
    authToken: string;
    sid: string;
    did: string;
    uid: string;
    additionalCategories: string[];
    host: string;
    pdata: {
      id: string;
      ver: string;
      pid: string;
    };
    actor: {
      id: string;
      type: string;
    };
    tags: string[];
    defaultLicense: string;
    endpoint: string;
    env: string;
    user: {
      id: string;
      orgIds: string[];
      organisations: Record<string, any>;
      fullName: string;
      firstName: string;
      lastName: string;
    };
  };
  config: {
    mode: 'edit' | 'review' | 'read';
    primaryCategory: string;
    objectType: string;
    showAddCollaborator: boolean;
    questionSet: {
      maxQuestionsLimit: number;
    };
  };
}

export interface QuestionSetMetadata {
  identifier: string;
  name: string;
  description?: string;
  primaryCategory: string;
  objectType: string;
  status: string;
  createdBy: string;
  channel: string;
  framework?: string;
  mimeType: string;
}

export class QumlEditorService {
  /**
   * Get questionset metadata for editing
   */
  async getQuestionSet<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<T>(`/questionset/v2/read/${questionSetId}?mode=edit`);
    return res.data;
  }

  /**
   * Lock content for editing
   */
  async lockContent<T = any>(questionSetId: string, userId: string): Promise<T> {
    const payload = {
      resourceId: questionSetId,
      resourceType: 'Content',
      resourceInfo: JSON.stringify({
        contentType: 'QuestionSet',
        identifier: questionSetId,
        mimeType: 'application/vnd.sunbird.questionset'
      }),
      creatorInfo: JSON.stringify({
        name: 'User',
        id: userId
      }),
      createdBy: userId
    };
    const res = await getClient().post<T>('/content/v1/lock/create', payload);
    return res.data;
  }

  /**
   * Retire/release content lock
   */
  async retireLock<T = any>(questionSetId: string): Promise<T> {
    const payload = {
      resourceId: questionSetId,
      resourceType: 'Content'
    };
    const res = await getClient().post<T>('/content/v1/lock/retire', payload);
    return res.data;
  }

  /**
   * Get category definition for questionset
   */
  async getCategoryDefinition<T = any>(
    objectType: string,
    primaryCategory: string,
    channel: string
  ): Promise<T> {
    const res = await getClient().get<T>(
      `/object/category/definition/v1/read?objectType=${objectType}&primaryCategory=${primaryCategory}&channel=${channel}`
    );
    return res.data;
  }

  /**
   * Create editor configuration object
   */
  createEditorConfig(
    metadata: QuestionSetMetadata,
    userContext: {
      uid: string;
      sid: string;
      did: string;
      channel: string;
      orgIds: string[];
      firstName: string;
      lastName: string;
    }
  ): EditorConfig {
    return {
      context: {
        identifier: metadata.identifier,
        channel: metadata.channel || userContext.channel,
        authToken: '',
        sid: userContext.sid,
        did: userContext.did,
        uid: userContext.uid,
        additionalCategories: [],
        host: window.location.origin,
        pdata: {
          id: 'sunbird.portal',
          ver: '7.0.0',
          pid: 'sunbird-portal'
        },
        actor: {
          id: userContext.uid,
          type: 'User'
        },
        tags: [],
        defaultLicense: 'CC BY 4.0',
        endpoint: '/data/v3/telemetry',
        env: 'questionset_editor',
        user: {
          id: userContext.uid,
          orgIds: userContext.orgIds,
          organisations: {},
          fullName: `${userContext.firstName} ${userContext.lastName}`.trim(),
          firstName: userContext.firstName,
          lastName: userContext.lastName
        }
      },
      config: {
        mode: this.getEditorMode(metadata.status),
        primaryCategory: metadata.primaryCategory,
        objectType: metadata.objectType,
        showAddCollaborator: false,
        questionSet: {
          maxQuestionsLimit: 500
        }
      }
    };
  }

  /**
   * Determine editor mode based on content status
   */
  private getEditorMode(status: string): 'edit' | 'review' | 'read' {
    const lowerStatus = status.toLowerCase();
    
    if (['draft', 'live', 'flagdraft', 'unlisted'].includes(lowerStatus)) {
      return 'edit';
    }
    
    if (['flagged', 'flagreview'].includes(lowerStatus)) {
      return 'read';
    }
    
    if (lowerStatus === 'review') {
      return 'review';
    }
    
    return 'edit';
  }
}

export const qumlEditorService = new QumlEditorService();
