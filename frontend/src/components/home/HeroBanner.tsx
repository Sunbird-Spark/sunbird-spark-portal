import { FiArrowRight, FiPlay, FiUsers, FiAward, FiBookOpen } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { useAppI18n } from "@/hooks/useAppI18n";
import { Link } from "react-router-dom";

const HeroBanner = () => {
  const { t } = useAppI18n();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 py-16 md:py-24 lg:py-32">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-48 h-48 bg-muted rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-start">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FiAward className="w-4 h-4" />
              <span>{t("certifiedProfessionals")}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              {t("heroTitle")}
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/courses">
                <Button
                  size="lg"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-base px-8"
                >
                  {t("exploreCourses")}
                  <FiArrowRight className="w-5 h-5 ms-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base"
              >
                <FiPlay className="w-5 h-5 me-2" />
                {t("watchDemo")}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12">
              <div className="flex items-center gap-2">
                <FiBookOpen className="w-5 h-5 text-secondary" />
                <span className="text-primary-foreground">
                  <strong>500+</strong> {t("courses")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-secondary" />
                <span className="text-primary-foreground">
                  <strong>50K+</strong> {t("activeLearners")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiAward className="w-5 h-5 text-secondary" />
                <span className="text-primary-foreground">
                  <strong>100+</strong> {t("certifications")}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="hidden lg:block relative">
            <div className="relative bg-card/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/10">
              <div className="grid grid-cols-2 gap-4">
                {/* Course Preview Cards */}
                <div className="bg-card rounded-xl p-4 shadow-lg animate-fade-in">
                  <div className="w-full h-24 bg-muted rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-2 bg-muted/60 rounded w-1/2" />
                </div>
                <div className="bg-card rounded-xl p-4 shadow-lg animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  <div className="w-full h-24 bg-secondary/30 rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-2 bg-muted/60 rounded w-1/2" />
                </div>
                <div className="bg-card rounded-xl p-4 shadow-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="w-full h-24 bg-primary/20 rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-2 bg-muted/60 rounded w-1/2" />
                </div>
                <div className="bg-card rounded-xl p-4 shadow-lg animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <div className="w-full h-24 bg-muted rounded-lg mb-3" />
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-2 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
