import { useState, useEffect } from "react";
import Header from "@/components/home/Header";
import HeroWithStats from "@/components/index/HeroWithStats";
import MostPopularContent from "@/components/index/MostPopularContent";
import CategorySection from "@/components/home/CategorySection";
import ResourceCenter from "@/components/index/ResourceCenter";
import PopularContent from "@/components/index/PopularContent";
import FAQSection from "@/components/index/FAQSection";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading Sunbird..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroWithStats />
        <MostPopularContent />
        <CategorySection />
        <ResourceCenter />
        <PopularContent />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
