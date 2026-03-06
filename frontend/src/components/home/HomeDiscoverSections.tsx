import PageLoader from "@/components/common/PageLoader";
import DynamicContentSection from "@/components/landing/DynamicContentSection";
import DynamicCategorySection from "@/components/landing/DynamicCategorySection";
import DynamicResourceSection from "@/components/landing/DynamicResourceSection";
import { useAppI18n } from '@/hooks/useAppI18n';
import { useFormRead } from "@/hooks/useForm";
import { FormSection } from "@/types/formTypes";

const HomeDiscoverSections = () => {
  const { t } = useAppI18n();
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
    return <PageLoader message={t('loadingContent')} fullPage={false} />;
  }

  if (error) {
    return (
      <PageLoader
        message={t('failedToLoadContent')}
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
            useCustomHeights={true}
          />
        );
      default:
        return null;
    }
  };

  return <>{sortedSections.map(renderSection)}</>;
};

export default HomeDiscoverSections;
