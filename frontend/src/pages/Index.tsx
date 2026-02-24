import Header from "@/components/home/Header";
import HeroWithStats from "@/components/landing/HeroWithStats";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import { useFormRead } from "@/hooks/useForm";
import DynamicContentSection from "@/components/landing/DynamicContentSection";
import DynamicCategorySection from "@/components/landing/DynamicCategorySection";
import DynamicResourceSection from "@/components/landing/DynamicResourceSection";
import { FormSection } from "@/types/formTypes";

const Index = () => {
  const { data: formData, isLoading, error, refetch } = useFormRead({
    request: {
      type: "page",
      subType: "landing",
      action: "sections",
      component: "portal",
      framework: "*",
      rootOrgId: "*"
    }
  });

  const sections = formData?.data?.form?.data?.sections || [];
  const sortedSections = [...sections].sort((a, b) => a.index - b.index);

  const renderSection = (section: FormSection) => {
    switch (section.type) {
      case 'content':
        return (
          <DynamicContentSection
            key={section.id}
            title={section.title}
            criteria={section.criteria}
          />
        );
      case 'categories':
        return (
          <DynamicCategorySection
            key={section.id}
            title={section.title}
            list={section.list}
          />
        );
      case 'resources':
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

  const renderDynamicSections = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto px-4 py-16">
          <PageLoader message="Loading sections..." fullPage={false} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="container mx-auto px-4 py-16">
          <PageLoader 
            error="Unable to load content sections. Please try again." 
            onRetry={() => refetch()} 
            fullPage={false} 
          />
        </div>
      );
    }

    if (sections.length === 0) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">No content sections available at the moment.</p>
        </div>
      );
    }

    return sortedSections.map(renderSection);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroWithStats />
        {renderDynamicSections()}
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
