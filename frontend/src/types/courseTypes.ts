export interface Course {
  courseName: string;
  completionPercentage: number;
  content: {
    appIcon: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CourseEnrollmentResponse {
  courses: Course[];
}
