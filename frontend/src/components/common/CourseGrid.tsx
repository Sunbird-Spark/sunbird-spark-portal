import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import CollectionCard from "@/components/content/CollectionCard";
import type { ContentSearchItem } from "@/types/workspaceTypes";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CourseGridProps {
    title: string;
    courses: ContentSearchItem[];
    className?: string;
}

export const CourseGrid = ({ title, courses, className = "mb-12" }: CourseGridProps) => {
    const { t } = useAppI18n();
    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 mt-6">
                <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal text-foreground">
                    {title}
                </h2>
                <Link to="/explore">
                    <Button
                        variant="ghost"
                        className="p-0 h-auto hover:bg-transparent text-sunbird-brick"
                        aria-label={t("courseGrid.viewAll")}
                    >
                        <FiArrowRight className="w-5 h-3" />
                    </Button>
                </Link>
            </div>

            {/* Course Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => (
                    <CollectionCard key={course.identifier} item={course} />
                ))}
            </div>
        </div>
    );
};
