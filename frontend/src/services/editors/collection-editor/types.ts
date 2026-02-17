export interface CollectionEditorContextProps {
    mode: string;
    cdata?: any[];
    objectType?: string;
    primaryCategory?: string;
    contextRollup?: { l1: string };
    objectRollup?: Record<string, any>;
}

export interface CollectionEditorConfig {
    context: {
        mode: string;
        sid: string;
        did: string;
        uid: string;
        channel: string;
        pdata: { id: string; ver: string; pid: string };
        contextRollup: { l1: string };
        cdata: any[];
        timeDiff: number;
        objectRollup: Record<string, any>;
        host: string;
        endpoint: string;
        user: { id: string; orgIds: string[] };
        identifier?: string;
    };
    config: Record<string, any>;
    metadata: any;
}

export interface CollectionEditorEvent {
    type: string;
    data?: any;
    [key: string]: any;
}