import PageLoader from "@/components/common/PageLoader";
import DynamicContentSection from "@/components/landing/DynamicContentSection";
import DynamicCategorySection from "@/components/landing/DynamicCategorySection";
import DynamicResourceSection from "@/components/landing/DynamicResourceSection";
import { useFormRead } from "@/hooks/useForm";
import { FormSection } from "@/types/formTypes";

const HomeDiscoverSections = () => {
  const { data: formData, isLoading, error, refetch } = useFormRead({
    request: {
      type: "page",
      subType: "home",
      action: "sections",
      component: "portal",
      framework: "*",
      rootOrgId: "*"
    }
  });

  if (isLoading) {
    return <PageLoader message="Loading content..." fullPage={false} />;
  }

  if (error) {
    return (
      <PageLoader
        message="Failed to load content."
        fullPage={false}
        error={error.message}
        onRetry={refetch}
      />
    );
  }

  const sections: FormSection[] = formData?.data?.form?.data?.sections ?? [];
  const sortedSections = [...sections].sort((a, b) => a.index - b.index);

  const renderSection = (section: FormSection) => {
    switch (section.type) {
      case "content":
        return (
          <DynamicContentSection
            key={section.id}
            title={section.title}
            criteria={section.criteria}
            sectionClassName="content-section-home"
            innerClassName="home-discover-inner"
          />
        );
      case "categories":
        return (
          <DynamicCategorySection
            key={section.id}
            title={section.title}
            list={section.list}
            innerClassName="home-discover-inner"
          />
        );
      case "resources":
        return (
          <DynamicResourceSection
            key={section.id}
            title={section.title}
            sectionLabel="resource.header"
            criteria={section.criteria}
            sectionClassName="resource-section-home"
            innerClassName="home-discover-resource-inner"
          />
        );
      default:
        return null;
    }
  };

  return <>{sortedSections.map(renderSection)}</>;
};

export default HomeDiscoverSections;
