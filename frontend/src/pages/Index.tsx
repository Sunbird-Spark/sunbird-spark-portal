import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import FeaturedCourses from "@/components/FeaturedCourses";
import CategorySection from "@/components/CategorySection";
import PopularCourses from "@/components/PopularCourses";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageLoader message="Loading Sunbird Spark..." />;
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
