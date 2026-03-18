import { FiUser } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";

export interface ContentCourse {
    id: string;
    title: string;
    image: string;
    type: string; // Using string to be more flexible, but traditionally "Course" | "Textbook" | "Skills"
    creator: string;
    learners: string;
    lessons: number;
}

interface CourseCardProps {
    course: ContentCourse;
}

export const CourseCard = ({ course }: CourseCardProps) => {
    const { t } = useAppI18n();

    const getBadgeStyle = () => {
        return "bg-[#FFF1C7] text-foreground font-rubik font-medium text-[0.875rem] leading-[1.125rem] border-[#CC8545] border-[0.0625rem]";
    };

    return (
        <Link
          to={`/collection/${course.id}`}
          className="flex justify-center"
          data-edataid="course-card-click"
          data-objectid={course.id}
          data-objecttype="Content"
        >
            <div
                className="group bg-white rounded-[1.25rem] overflow-hidden transition-all duration-300 hover:shadow-lg shadow-[0.125rem_0.125rem_1.25rem_0rem_rgba(0,0,0,0.09)] w-full max-w-[23.125rem] h-[24.5rem] flex flex-col mx-auto"
            >
                {/* Image with padding */}
                <div className="px-[1.25rem] pt-[1.25rem] w-full">
                    <div className="relative overflow-hidden rounded-[1.25rem] h-[10.125rem] w-full">
                        <img
                            src={course.image}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-[1.25rem]"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-[1.25rem] pt-[1.25rem] pb-5 flex flex-col flex-grow">
                    {/* Badge below image */}
                    <Badge
                        className={`inline-flex items-center justify-center p-0 rounded-[2.25rem] mb-[1.25rem] ${course.type === 'Textbook' ? 'w-[5.875rem]' : 'w-[4.875rem]'} h-[1.875rem] ${getBadgeStyle()}`}
                    >
                        {t(`contentTypes.${course.type.toLowerCase()}`, { defaultValue: course.type })}
                    </Badge>

                    {/* Title */}
                    <h3
                        className="font-rubik font-medium text-[1.25rem] leading-[1.75rem] tracking-normal bg-transparent border-0 text-foreground mb-[1.25rem] min-h-[3.5rem]"
                    >
                        {course.title}
                    </h3>

                    {/* Stats - Pushed to bottom */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-[0.125rem] mt-auto">
                        <div className="flex items-center gap-1">
                            <FiUser className="w-3 h-3 text-sunbird-brick -translate-y-0.5" />
                            <span className="text-xs text-muted-foreground">{course.creator}</span>
                        </div>
                        <span className="mx-0.5">•</span>
                        <span>{course.learners} {t("contentStats.learners")}</span>
                        <span className="mx-0.5">•</span>
                        <span>{course.lessons} {t("contentStats.lessons")}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
