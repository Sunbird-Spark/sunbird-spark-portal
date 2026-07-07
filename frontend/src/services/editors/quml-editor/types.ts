export interface QumlEditorContextOverrides {
  mode?: 'edit' | 'review' | 'read';
  contextRollup?: Record<string, any>;
  cdata?: any[];
  objectRollup?: Record<string, any>;
}

export interface QumlEditorConfig {
  context: {
    identifier: string;
    mode: 'edit' | 'review' | 'read';
    sid: string;
    did: string;
    uid: string;
    channel: string;
    /** Framework id (e.g. NCF) — drives the Audience & Curriculum dropdowns. */
    framework?: string;
    pdata: { id: string; ver: string; pid: string };
    contextRollup: Record<string, any>;
    cdata: any[];
    objectRollup: Record<string, any>;
    host: string;
    endpoint: string;
    timeDiff: number;
    cloudStorageUrls: string[];
    user: {
      id: string;
      orgIds: string[];
    };
  };
  config: {
    mode: 'edit' | 'review' | 'read';
    apiSlug?: string;
    primaryCategory: string;
    objectType: string;
    showAddCollaborator: boolean;
    questionSet: {
      maxQuestionsLimit: number;
    };
    /** Path the editor's preview loads the QuML player bundle from. */
    playerScriptUrl?: string;
    /** Max hierarchy depth (root + sections + questions). */
    maxDepth?: number;
  };
  metadata: QuestionSetMetadata;
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

export interface QumlEditorEvent {
  type: string;
  data?: any;
  [key: string]: any;
}
