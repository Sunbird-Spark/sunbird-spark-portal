import { useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/button";
import CourseCard from "./CourseCard";
import { featuredCourses } from "@/configs/mockData";
import { useAppI18n } from "@/hooks/useAppI18n";
import { Link } from "react-router-dom";

const FeaturedCourses = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useAppI18n();

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="courses" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {t("featuredCourses")}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Hand-picked courses by our expert team to accelerate your professional growth
            </p>
          </div>
          <Link to="/courses">
            <Button variant="ghost" className="text-primary hover:text-primary/90 self-start md:self-auto">
              {t("viewAll")}
              <FiArrowRight className="w-4 h-4 ms-2" />
            </Button>
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons - Desktop */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-card shadow-lg border-border hidden lg:flex"
            onClick={() => scroll("left")}
          >
            <FiChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-card shadow-lg border-border hidden lg:flex"
            onClick={() => scroll("right")}
          >
            <FiChevronRight className="w-5 h-5" />
          </Button>

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                className="min-w-[17.5rem] md:min-w-[20rem] snap-start"
              >
                <CourseCard course={course} />
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center gap-2 mt-6 lg:hidden">
          {featuredCourses.map((_, index) => (
            <button
              key={index}
              className="w-2 h-2 rounded-full bg-border hover:bg-primary transition-colors"
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
