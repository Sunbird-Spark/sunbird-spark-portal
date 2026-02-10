import { FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import CourseCard from "../home/CourseCard";
import { popularCourses } from "@/configs/mockData";
import { useAppI18n } from "@/hooks/useAppI18n";
import { Link } from "react-router-dom";

const PopularCourses = () => {
  const { t } = useAppI18n();

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {t("popularCourses")}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Most enrolled courses by professionals like you
            </p>
          </div>
          <Link to="/courses">
            <Button variant="ghost" className="text-primary hover:text-primary/90 self-start md:self-auto">
              {t("viewAll")}
              <FiArrowRight className="w-4 h-4 ms-2" />
            </Button>
          </Link>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {popularCourses.slice(0, 8).map((course) => (
            <Link key={course.id} to={`/course/${course.id}`}>
              <CourseCard course={course} />
            </Link>
          ))}
        </div>

        {/* Load More Button - Mobile */}
        <div className="flex justify-center mt-8 md:hidden">
          <Button variant="outline" className="w-full max-w-xs">
            Load More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;
