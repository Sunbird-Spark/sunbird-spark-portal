import { useState, useEffect } from "react";
import Header from "@/components/lms/Header";
import HeroBanner from "@/components/lms/HeroBanner";
import FeaturedCourses from "@/components/lms/FeaturedCourses";
import CategorySection from "@/components/lms/CategorySection";
import PopularCourses from "@/components/lms/PopularCourses";
import StatsSection from "@/components/lms/StatsSection";
import Footer from "@/components/lms/Footer";
import PageLoader from "@/components/lms/PageLoader";
import { type Language, type LanguageCode } from "@/configs/translations";

const Index = () => {
  const [currentLang, setCurrentLang] = useState<LanguageCode>("en");
  const [isLoading, setIsLoading] = useState(true);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang.code);
  };

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
      <Header currentLang={currentLang} onLanguageChange={handleLanguageChange} />
      <main>
        <HeroBanner currentLang={currentLang} />
        <FeaturedCourses currentLang={currentLang} />
        <CategorySection currentLang={currentLang} />
        <PopularCourses currentLang={currentLang} />
        <StatsSection currentLang={currentLang} />
      </main>
      <Footer currentLang={currentLang} />
    </div>
  );
};

export default Index;
