import { useParams } from "react-router-dom";
import ReportLayout from "@/components/reports/ReportLayout";
import CourseReportContent from "@/components/reports/CourseReportContent";
import { courseReportSummary } from "@/data/reportsMockData";

const CourseReport = () => {
  const { courseId } = useParams();
  const summary = courseReportSummary;

  return (
    <ReportLayout
      title={summary.courseName}
      breadcrumbs={[{ label: "Home", href: "/home" }, { label: "Admin Reports", href: "/reports/platform" }, { label: "Course Report" }]}
    >
      <CourseReportContent courseId={courseId} />
    </ReportLayout>
  );
};

export default CourseReport;
