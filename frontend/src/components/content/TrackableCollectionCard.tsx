import { Link } from "react-router-dom";
import { TrackableCollection } from "@/types/TrackableCollections";
import { FiBookOpen } from "react-icons/fi";


interface TrackableCollectionCardProps {
  course: TrackableCollection;
  index: number;
}

const TrackableCollectionCard = ({ course, index }: TrackableCollectionCardProps) => {
  return (
    <Link
      to={`/content/${course.courseId}`}
      className="block"
    >
      <div
        className="flex gap-6 p-6 bg-white rounded-2xl border border-[#F3F4F6] hover:shadow-md transition-shadow"
      >
        {/* Thumbnail */}
        {course.content?.appIcon ? (
          <img
            src={course.content.appIcon}
            alt={course.courseName}
            className="w-[7.5rem] h-[7.5rem] rounded-2xl object-cover flex-shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-[7.5rem] h-[7.5rem] rounded-2xl bg-black flex-shrink-0 shadow-sm" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-bold text-[1.125rem] leading-[1.4] text-[#222222] line-clamp-2 mb-6 font-['Rubik']">
            {course.courseName}
          </h4>
          <p className="text-[1rem] font-normal text-[#222222] mb-3 font-['Rubik']">
            Completed : <span className="font-medium">{course.completionPercentage}%</span>
          </p>
          {/* Progress Bar */}
          <div 
            className="h-2 bg-[#F4F4F4] rounded-[0.625rem] max-w-[22.5rem]"
            role="progressbar" 
            aria-valuenow={course.completionPercentage} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-label="Course completion"
          >
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
