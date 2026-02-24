export interface Batch {
  identifier: string;
  batchId: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: number;
  enrollmentType: string;
  createdBy: string;
  [key: string]: any;
}

export interface IssuedCertificate {
  identifier: string;
  lastIssuedOn: string;
  name: string;
  templateUrl: string;
  token?: string;
  type?: string;
}

export interface TrackableCollection {
  courseId: string;
  courseName: string;
  collectionId: string;
  contentId: string;
  batchId: string;
  userId: string;
  addedBy: string;
  active: boolean;
  status: number;
  completionPercentage: number;
  progress: number;
  leafNodesCount: number;
  description: string;
  courseLogoUrl: string;
  dateTime: number;
  enrolledDate: number;
  completedOn?: number;
  lastReadContentId?: string;
  lastReadContentStatus?: number;
  lastContentAccessTime?: number;
  certstatus?: any;
  oldEnrolledDate?: any;
  batch?: Batch;
  issuedCertificates?: IssuedCertificate[];
  certificates?: any[];
  contentStatus?: Record<string, number>;
  content?: {
    identifier: string;
    name: string;
    description: string;
    appIcon: string;
    mimeType: string;
    primaryCategory: string;
    contentType: string;
    resourceType: string;
    objectType: string;
    pkgVersion: number;
    channel: string;
    organisation: string[];
    trackable: {
      enabled: string;
      autoBatch: string;
    };
    orgDetails?: {
      email: string | null;
      orgName: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CourseEnrollmentResponse {
  courses?: TrackableCollection[];
}
