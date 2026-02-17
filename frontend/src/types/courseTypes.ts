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

export interface Course {
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
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CourseEnrollmentResponse {
  courses: Course[];
}
