import type {
  ContentStatusCount,
  ContentByGroup,
  TopCreator,
  PopularContent,
  AdminCourseSummary,
  EnrollmentCompletion,
  ProgressBucket,
  LearnerProgress,
  AssessmentRecord,
  CourseReportSummary,
  UserReportSummary,
  UserCourseProgress,
  UserCertificate,
  UserAssessmentHistory,
  UserConsentRecord,
} from "@/types/reports";

/* ── MODULE 1 – Platform ── */

export const contentStatusCounts: ContentStatusCount[] = [
  { status: "Live", count: 245 },
  { status: "Draft", count: 82 },
  { status: "Retired", count: 31 },
];

export const contentByTaxonomy: ContentByGroup[] = [
  { group: "Board 1", count: 120 },
  { group: "Grade 5", count: 95 },
  { group: "Medium Hindi", count: 78 },
  { group: "Subject Math", count: 65 },
];

export const contentBySkills: ContentByGroup[] = [
  { group: "Communication", count: 88 },
  { group: "Problem Solving", count: 74 },
  { group: "Critical Thinking", count: 62 },
  { group: "Digital Literacy", count: 53 },
];

export const contentByType: ContentByGroup[] = [
  { group: "Course", count: 110 },
  { group: "Resource", count: 90 },
  { group: "Collection", count: 45 },
  { group: "Textbook", count: 35 },
];

export const contentByCategory: ContentByGroup[] = [
  { group: "Science", count: 92 },
  { group: "Mathematics", count: 85 },
  { group: "Languages", count: 68 },
  { group: "Social Studies", count: 52 },
];

export const topCreators: TopCreator[] = [
  { name: "Dr. Priya Sharma", count: 45 },
  { name: "Raj Patel", count: 38 },
  { name: "Anita Desai", count: 32 },
  { name: "Vikram Singh", count: 28 },
  { name: "Meera Nair", count: 24 },
];

export const popularContent: PopularContent[] = [
  { id: "1", title: "Introduction to AI", enrollments: 2340, views: 8900, type: "Course" },
  { id: "2", title: "Data Science Basics", enrollments: 1890, views: 7200, type: "Course" },
  { id: "3", title: "Web Development 101", enrollments: 1650, views: 6100, type: "Course" },
  { id: "4", title: "Python Programming", enrollments: 1420, views: 5800, type: "Resource" },
  { id: "5", title: "Machine Learning Guide", enrollments: 1280, views: 5200, type: "Textbook" },
];

export const adminCourseSummaries: AdminCourseSummary[] = Array.from({ length: 25 }, (_, i) => ({
  id: `course-${i + 1}`,
  courseName: [
    "Introduction to Artificial Intelligence",
    "Data Science Fundamentals",
    "Web Development Bootcamp",
    "Python for Beginners",
    "Machine Learning Essentials",
    "Cloud Computing Basics",
    "Cybersecurity 101",
    "Digital Marketing Strategy",
    "Project Management Professional",
    "UX Design Principles",
    "React & TypeScript Masterclass",
    "Database Administration",
    "DevOps Engineering",
    "Mobile App Development",
    "Blockchain Fundamentals",
    "Natural Language Processing",
    "Computer Vision Workshop",
    "API Design & Integration",
    "Agile Methodology",
    "Business Analytics",
    "IoT Solutions",
    "Kubernetes in Practice",
    "Advanced SQL Queries",
    "Statistical Analysis",
    "Leadership & Communication",
  ][i]!,
  totalEnrolled: Math.floor(Math.random() * 500) + 100,
  totalCompleted: Math.floor(Math.random() * 300) + 50,
  completionPercent: Math.floor(Math.random() * 60) + 30,
  certificatesIssued: Math.floor(Math.random() * 200) + 20,
  lastUpdated: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
}));

/* ── MODULE 2 – Course Report ── */

export const courseReportSummary: CourseReportSummary = {
  courseId: "course-1",
  courseName: "Introduction to Artificial Intelligence",
  totalEnrolled: 456,
  totalCompleted: 312,
  certificatesIssued: 298,
  avgScore: 78.5,
};

export const enrollmentVsCompletion: EnrollmentCompletion[] = [
  { label: "Week 1", enrolled: 120, completed: 45 },
  { label: "Week 2", enrolled: 98, completed: 62 },
  { label: "Week 3", enrolled: 85, completed: 78 },
  { label: "Week 4", enrolled: 76, completed: 68 },
  { label: "Week 5", enrolled: 52, completed: 42 },
  { label: "Week 6", enrolled: 25, completed: 17 },
];

export const progressBuckets: ProgressBucket[] = [
  { bucket: "0–25%", count: 45 },
  { bucket: "25–50%", count: 38 },
  { bucket: "50–75%", count: 52 },
  { bucket: "75–100%", count: 78 },
];


export const learnerProgressData: LearnerProgress[] = Array.from({ length: 30 }, (_, i) => ({
  id: `learner-${i + 1}`,
  learnerName: [
    "Aarav Mehta", "Priya Sharma", "Rohan Gupta", "Sneha Reddy", "Vikram Joshi",
    "Ananya Iyer", "Arjun Patel", "Divya Nair", "Karan Singh", "Meera Kapoor",
    "Nikhil Das", "Pooja Verma", "Rahul Kumar", "Sanya Aggarwal", "Tarun Bhatt",
    "Usha Pillai", "Varun Rao", "Yamini Desai", "Zara Khan", "Aditya Saxena",
    "Bhavna Jain", "Chirag Malhotra", "Deepika Menon", "Eshan Tiwari", "Falguni Shah",
    "Gaurav Mishra", "Hina Bose", "Ishaan Chauhan", "Jyoti Pandit", "Kunal Srinivasan",
  ][i]!,
  enrollmentDate: `2025-0${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  progressPercent: Math.floor(Math.random() * 100),
  status: (["In Progress", "Completed", "Not Started"] as const)[Math.floor(Math.random() * 3)]!,
  lastActiveDate: `2025-10-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  certificateStatus: (["Issued", "N/A"] as const)[Math.floor(Math.random() * 2)]!,
}));

export const assessmentRecords: AssessmentRecord[] = Array.from({ length: 20 }, (_, i) => {
  const score = Math.floor(Math.random() * 100);
  return {
    id: `assess-${i + 1}`,
    learnerName: learnerProgressData[i % learnerProgressData.length]!.learnerName,
    attemptNumber: Math.floor(Math.random() * 3) + 1,
    score,
    maxScore: 100,
    percentage: score,
    passFail: score >= 40 ? "Pass" : "Fail",
    attemptDate: `2025-10-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  };
});

/* ── MODULE 3 – User Profile Report ── */

export const userReportSummary: UserReportSummary = {
  userId: "user-1",
  userName: "Aarav Mehta",
  coursesCompleted: 12,
  coursesPending: 4,
  certificatesIssued: 10,
  contentCompleted: 48,
  assessmentsCompleted: 15,
};

export const userCourseProgressData: UserCourseProgress[] = [
  { id: "1", courseName: "Introduction to AI", progressPercent: 100, status: "Completed", enrollmentDate: "2025-01-15", lastAccessed: "2025-03-20" },
  { id: "2", courseName: "Data Science Basics", progressPercent: 75, status: "In Progress", enrollmentDate: "2025-02-10", lastAccessed: "2025-10-18" },
  { id: "3", courseName: "Web Development 101", progressPercent: 100, status: "Completed", enrollmentDate: "2025-03-05", lastAccessed: "2025-06-12" },
  { id: "4", courseName: "Python Programming", progressPercent: 45, status: "In Progress", enrollmentDate: "2025-04-20", lastAccessed: "2025-10-15" },
  { id: "5", courseName: "Cloud Computing", progressPercent: 0, status: "Not Started", enrollmentDate: "2025-09-01", lastAccessed: "2025-09-01" },
  { id: "6", courseName: "Machine Learning", progressPercent: 100, status: "Completed", enrollmentDate: "2025-01-25", lastAccessed: "2025-05-10" },
];

export const userCertificates: UserCertificate[] = [
  { id: "1", courseName: "Introduction to AI", issuedDate: "2025-03-22", certificateId: "CERT-AI-001" },
  { id: "2", courseName: "Web Development 101", issuedDate: "2025-06-14", certificateId: "CERT-WD-012" },
  { id: "3", courseName: "Machine Learning", issuedDate: "2025-05-12", certificateId: "CERT-ML-008" },
];

export const userAssessmentHistory: UserAssessmentHistory[] = [
  { id: "1", courseName: "Introduction to AI", assessmentName: "Final Exam", score: 88, maxScore: 100, percentage: 88, attemptDate: "2025-03-18" },
  { id: "2", courseName: "Data Science Basics", assessmentName: "Mid-Term Quiz", score: 72, maxScore: 100, percentage: 72, attemptDate: "2025-08-22" },
  { id: "3", courseName: "Web Development 101", assessmentName: "Project Submission", score: 95, maxScore: 100, percentage: 95, attemptDate: "2025-06-10" },
  { id: "4", courseName: "Python Programming", assessmentName: "Quiz 1", score: 35, maxScore: 100, percentage: 35, attemptDate: "2025-07-15" },
  { id: "5", courseName: "Python Programming", assessmentName: "Quiz 1 (Retake)", score: 68, maxScore: 100, percentage: 68, attemptDate: "2025-07-22" },
];

/* ── MODULE 4 – User Consent Management ── */

const CONSENT_USER_NAMES = [
  "Aarav Mehta", "Priya Sharma", "Rohan Gupta", "Sneha Reddy", "Vikram Joshi",
  "Ananya Iyer", "Arjun Patel", "Divya Nair", "Karan Singh", "Meera Kapoor",
  "Nikhil Das", "Pooja Verma", "Rahul Kumar", "Sanya Aggarwal", "Tarun Bhatt",
  "Usha Pillai", "Varun Rao", "Yamini Desai", "Zara Khan", "Aditya Saxena",
  "Bhavna Jain", "Chirag Malhotra", "Deepika Menon", "Eshan Tiwari", "Falguni Shah",
  "Gaurav Mishra", "Hina Bose", "Ishaan Chauhan", "Jyoti Pandit", "Kunal Srinivasan",
];

const CONSENT_STATUSES: UserConsentRecord["consentStatus"][] = ["Granted", "Granted", "Revoked"];

const MOCK_COURSES = ["Business and Management", "Finance and Accounting", "Information Technology", "Multi Quiz Contest"];

export const userConsentData: UserConsentRecord[] = Array.from({ length: 40 }, (_, i) => {
  const status = CONSENT_STATUSES[i % CONSENT_STATUSES.length]!;
  const month = String((i % 12) + 1).padStart(2, "0");
  const day = String((i % 28) + 1).padStart(2, "0");
  const consentGivenOn = status === "Granted" ? `2025-${month}-${day}` : null;
  return {
    id: `consent-${i + 1}`,
    userId: `user-${i + 1}`,
    userName: CONSENT_USER_NAMES[i % CONSENT_USER_NAMES.length]!,
    email: `user${i + 1}@example.org`,
    consentStatus: status,
    course: MOCK_COURSES[i % MOCK_COURSES.length]!,
    consentGivenOn,
    expiry: `2025-${month}-${day}`,
  };
});
