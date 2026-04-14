/** Course consent: share PII with course administrators or not. */
export type ConsentStatus = 'ACTIVE' | 'REVOKED';

/* ---------- User Consent Management Report ---------- */

/** Raw shape returned by POST /observability/v1/reports for user-consent-summary */
export interface UserConsentApiItem {
  user_id: string;
  object_id: string;
  status: ConsentStatus;
  created_on: string;
  expiry?: string | null;
  userDetails: { firstName: string; lastName: string; maskedEmail: string };
  collectionDetails?: { name: string; identifier: string; contentType: string };
}

export interface UserConsentSummaryResult {
  data: UserConsentApiItem[];
  count: number;
}

export interface UserConsentRecord {
  id: string;
  userId: string;
  userName: string;
  email: string;
  consentStatus: 'Granted' | 'Revoked';
  course: string;
  /** null when consent has never been given */
  consentGivenOn: string | null;
  expiry: string | null;
}

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
