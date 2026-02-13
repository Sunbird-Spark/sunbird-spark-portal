import { useState, useEffect } from "react";
import Header from "@/components/home/Header";
import HeroBanner from "@/components/home/HeroBanner";
import FeaturedCourses from "@/components/home/FeaturedCourses";
import CategorySection from "@/components/home/CategorySection";
import PopularCourses from "@/components/home/PopularCourses";
import StatsSection from "@/components/home/StatsSection";
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
        <HeroBanner />
        <FeaturedCourses />
        <CategorySection />
        <PopularCourses />
        <StatsSection />

      </main>
      <Footer />
    </div>
  );
};

export default Index;
