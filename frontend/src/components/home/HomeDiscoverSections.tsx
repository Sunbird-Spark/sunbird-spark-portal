import PageLoader from "@/components/common/PageLoader";
import DynamicContentSection from "@/components/landing/DynamicContentSection";
import DynamicCategorySection from "@/components/landing/DynamicCategorySection";
import DynamicResourceSection from "@/components/landing/DynamicResourceSection";
import { useFormRead } from "@/hooks/useForm";
import { FormSection } from "@/types/formTypes";

const HomeDiscoverSections = () => {
  const { data: formData, isLoading, error } = useFormRead({
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
    return null;
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
          />
        );
      case "categories":
        return (
          <DynamicCategorySection
            key={section.id}
            title={section.title}
            list={section.list}
          />
        );
      case "resources":
        return (
          <DynamicResourceSection
            key={section.id}
            title={section.title}
            criteria={section.criteria}
          />
        );
      default:
        return null;
    }
  };

  return <>{sortedSections.map(renderSection)}</>;
};

export default HomeDiscoverSections;
