import { useParams } from "react-router-dom";
import ReportLayout from "@/components/reports/ReportLayout";
import useImpression from "@/hooks/useImpression";
import CourseReportContent from "@/components/reports/CourseReportContent";
import { courseReportSummary } from "@/data/reportsMockData";

const CourseReport = () => {
  const { courseId } = useParams();
  useImpression({ type: 'view', pageid: 'course-report', object: { id: courseId || '', type: 'Collection' } });
  const summary = courseReportSummary;

  return (
    <ReportLayout
      title={summary.courseName}
    >
      <CourseReportContent courseId={courseId} />
    </ReportLayout>
  );
};

export default CourseReport;
