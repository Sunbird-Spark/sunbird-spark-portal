import { Link } from "react-router-dom";
import { TrackableCollection } from "@/types/TrackableCollections";
import { FiBookOpen } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";


interface TrackableCollectionCardProps {
  course: TrackableCollection;
  index: number;
}

const TrackableCollectionCard = ({ course, index }: TrackableCollectionCardProps) => {
  const { t } = useAppI18n();
  
  return (
    <Link
      to={`/collection/${course.collectionId}`}
      state={{ from: '/my-learning' }}
      className="block"
    >
      <div
        className="flex gap-6 p-6 bg-white rounded-2xl border border-sunbird-gray-f3 hover:shadow-md transition-shadow"
      >
        {/* Thumbnail */}
        {(course.content?.posterImage || course.content?.appIcon || course.courseLogoUrl) ? (
          <img
            src={course.content?.posterImage || course.content?.appIcon || course.courseLogoUrl}
            alt={course.courseName}
            className="w-[7.5rem] h-[7.5rem] rounded-2xl object-cover flex-shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-[7.5rem] h-[7.5rem] rounded-2xl bg-black flex-shrink-0 shadow-sm" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-bold text-[1.125rem] leading-[1.4] text-sunbird-obsidian line-clamp-2 mb-2 font-['Rubik']">
            {course.courseName}
          </h4>
          <p className="text-[1rem] font-normal text-sunbird-obsidian mb-3 font-['Rubik']">
            {t('trackableCollection.completed')} : <span className="font-medium">{course.completionPercentage}%</span>
          </p>
          {/* Progress Bar */}
          <div 
            className="mylearning-progress-bar-container max-w-[22.5rem]"
            role="progressbar" 
            aria-valuenow={course.completionPercentage} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-label="Course completion"
          >
            <div
              className="mylearning-progress-bar-fill transition-all"
              style={{ width: `${course.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TrackableCollectionCard;
