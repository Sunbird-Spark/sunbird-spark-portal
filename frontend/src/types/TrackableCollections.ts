export interface Batch {
  batchId: string;
  startDate: string;
  endDate?: string;
  status: number;
  enrollmentType: string;
  createdBy: string;
  certificates?: any[];
  [key: string]: any;
}

export interface TrackableCollection {
  courseId: string;
  courseName: string;
  completionPercentage: number;
  progress?: number;
  leafNodesCount?: number;
  description?: string;
  lastUpdatedOn?: string;
  appIcon?: string;
  batch?: Batch;
  content?: {
    appIcon: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CourseEnrollmentResponse {
  courses: TrackableCollection[];
}
