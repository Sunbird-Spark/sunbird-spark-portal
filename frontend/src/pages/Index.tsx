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
  const { data: formData, isLoading, error } = useFormRead({
    request: {
      type: "page",
      subType: "landing",
      action: "sections",
      component: "portal",
      framework: "*",
      rootOrgId: "*"
    }
  });

  if (isLoading) {
    return <PageLoader message="Loading Sunbird..." />;
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroWithStats />
        {sortedSections.map(renderSection)}
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;