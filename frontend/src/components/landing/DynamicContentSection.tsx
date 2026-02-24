import { useContentSearch } from "@/hooks/useContent";
import { CourseGrid } from "@/components/common/CourseGrid";
import { ContentSearchRequest } from "@/types/workspaceTypes";
import "./landing.css";

interface DynamicContentSectionProps {
  title: string;
  criteria?: {
    request: ContentSearchRequest;
  };
  sectionClassName?: string;
  innerClassName?: string;
}

const DynamicContentSection = ({ title, criteria, sectionClassName = "content-section", innerClassName = "landing-section-inner" }: DynamicContentSectionProps) => {
  const { data, isLoading, error } = useContentSearch({
    request: criteria?.request,
    enabled: !!criteria?.request,
  });

  if (isLoading) {
    return (
      <section className={sectionClassName}>
        <div className={innerClassName}>
          <div className="content-section-skeleton-title"></div>
          <div className="content-section-skeleton-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="content-section-skeleton-card"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !data?.data?.content) {
    return null;
  }

  const contents = data.data.content || [];

  return (
    <section className={sectionClassName}>
      <div className={innerClassName}>
        <CourseGrid
          title={title}
          courses={contents}
          className="mb-0"
        />
      </div>
    </section>
  );
};

export default DynamicContentSection;
