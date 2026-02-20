import { useContentSearch } from "@/hooks/useContent";
import { CourseGrid } from "@/components/common/CourseGrid";
import { ContentSearchRequest } from "@/types/workspaceTypes";

interface DynamicContentSectionProps {
  title: string;
  criteria?: {
    request: ContentSearchRequest;
  };
}

const DynamicContentSection = ({ title, criteria }: DynamicContentSectionProps) => {
  const { data, isLoading, error } = useContentSearch({
    request: criteria?.request,
    enabled: !!criteria?.request,
  });

  if (isLoading) {
    return (
      <section className="pt-8 lg:pt-[3.75rem] pb-8 bg-white">
        <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
          <div className="h-8 w-64 bg-gray-200 animate-pulse mb-6 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {[1, 2, 3].map((i) => (
               <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[1.25rem]"></div>
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
    <section className="pt-8 lg:pt-[3.75rem] pb-8 bg-white">
      <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
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
