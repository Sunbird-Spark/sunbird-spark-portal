import { useState, useEffect } from "react";
import Header from "@/components/lms/Header";
import HeroBanner from "@/components/lms/HeroBanner";
import FeaturedCourses from "@/components/lms/FeaturedCourses";
import CategorySection from "@/components/lms/CategorySection";
import PopularCourses from "@/components/lms/PopularCourses";
import StatsSection from "@/components/lms/StatsSection";
import Footer from "@/components/lms/Footer";
import PageLoader from "@/components/lms/PageLoader";

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
