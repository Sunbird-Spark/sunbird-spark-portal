export interface Content {
    identifier: string;
    name: string;
    appIcon: string;
    primaryCategory: string;
    contentType: string;
    mimeType: string;
    pkgVersion: number;
    objectType: string;
    organisation?: string[];
    channel: string;
    leafNodesCount?: number;
    resourceType?: string;
    gradeLevel?: string[];
    medium?: string[];
    board?: string;
    subject?: string | string[];
    trackable?: {
        enabled: string;
        autoBatch: string;
    };
    lastUpdatedOn?: string;
}

export interface ContentSearchFilters {
    primaryCategory?: string[];
    visibility?: string[];
    [key: string]: any;
}

export interface ContentSortBy {
    [key: string]: "asc" | "desc";
}

export interface SearchResponse {
    id: string;
    ver: string;
    ts: string;
    params: {
        resmsgid: string;
        msgid: string;
        status: string;
        err: string | null;
        errmsg: string | null;
    };
    responseCode: string;
    result: {
        count: number;
        content: Content[];
        facets?: any[];
    };
}
