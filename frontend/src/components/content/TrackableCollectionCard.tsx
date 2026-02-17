import { Link } from "react-router-dom";
import { Course } from "@/types/courseTypes";

const DEFAULT_THUMBNAIL = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop";

interface TrackableCollectionCardProps {
  course: Course;
  index?: number;
}

const TrackableCollectionCard = ({ course, index }: TrackableCollectionCardProps) => {
  return (
    <Link
      key={course.courseId || index}
      to={`/content/${course.courseId}`}
      className="block"
    >
      <div
        className="flex gap-6 p-6 bg-white rounded-2xl border border-[#F3F4F6] hover:shadow-md transition-shadow"
      >
        {/* Thumbnail */}
        <img
          src={course.content?.appIcon || DEFAULT_THUMBNAIL}
          alt={course.courseName}
          className="w-[7.5rem] h-[7.5rem] rounded-2xl object-cover flex-shrink-0 shadow-sm"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-bold text-[1.125rem] leading-[1.4] text-[#222222] line-clamp-2 mb-6 font-['Rubik']">
            {course.courseName}
          </h4>
          <p className="text-[1rem] font-normal text-[#222222] mb-3 font-['Rubik']">
            Completed : <span className="font-medium">{course.completionPercentage}%</span>
          </p>
          {/* Progress Bar */}
          <div className="h-2 bg-[#F4F4F4] rounded-[0.625rem] max-w-[22.5rem]">
            <div
              className="h-full bg-[#A85236] rounded-[0.625rem] transition-all"
              style={{ width: `${course.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TrackableCollectionCard;
