/** Course consent: share PII with course administrators or not. */
export type ConsentStatus = 'ACTIVE' | 'REVOKED';

export interface ConsentReadRequest {
  userId: string;
  consumerId: string;
  objectId: string;
}

export interface ConsentItem {
  status: ConsentStatus;
  userId: string;
  consumerId: string;
  objectId: string;
  objectType?: string;
  lastUpdatedOn?: string;
}

export interface ConsentReadResponse {
  consents?: ConsentItem[];
}

export interface ConsentUpdateRequest {
  status: ConsentStatus;
  userId: string;
  consumerId: string;
  objectId: string;
  objectType: 'Collection';
}

export interface ConsentUpdateResponse {
  consent?: { userId: string };
  message?: string;
}
