import { useState, useEffect } from "react";
import Header from "@/components/home/Header";
import HeroWithStats from "@/components/landing/HeroWithStats";
import MostPopularContent from "@/components/landing/MostPopularContent";
import CategorySection from "@/components/home/CategorySection";
import ResourceCenter from "@/components/landing/ResourceCenter";
import PopularContent from "@/components/landing/PopularContent";
import FAQSection from "@/components/landing/FAQSection";
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
