import { FiStar, FiClock, FiUsers, FiBookOpen } from "react-icons/fi";
import { Card, CardContent } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { useAppI18n } from "@/hooks/useAppI18n";

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  duration: string;
  lessons: number;
  enrolledCount: number;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  isFeatured?: boolean;
}

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { t } = useAppI18n();

  return (
    <Card className="group overflow-hidden border-border hover:shadow-xl transition-all duration-300 bg-card h-full">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <div 
          className="aspect-video bg-muted bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ 
            backgroundImage: `url(${course.thumbnail})`,
            backgroundColor: 'hsl(var(--muted))'
          }}
        />
        {course.isFeatured && (
          <Badge className="absolute top-3 start-3 bg-secondary text-secondary-foreground">
            Featured
          </Badge>
        )}
        <Badge 
          variant="outline" 
          className="absolute top-3 end-3 bg-card/90 backdrop-blur-sm"
        >
          {course.level}
        </Badge>
      </div>

      <CardContent className="p-4 md:p-5">
        {/* Category */}
        <p className="text-xs font-medium text-primary mb-2">{course.category}</p>

        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-sm text-muted-foreground mb-3">by {course.instructor}</p>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <FiStar className="w-4 h-4 fill-secondary text-secondary" />
            <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
            <span>({course.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1">
            <FiClock className="w-3.5 h-3.5" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiBookOpen className="w-3.5 h-3.5" />
            <span>{course.lessons} {t("lessons")}</span>
          </div>
        </div>

        {/* Enrolled count */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FiUsers className="w-3.5 h-3.5" />
          <span>{course.enrolledCount.toLocaleString()} {t("students")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
