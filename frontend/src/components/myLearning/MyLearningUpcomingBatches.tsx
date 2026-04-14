import { TrackableCollection } from "@/types/TrackableCollections";
import { FiBookOpen } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";


interface MyLearningUpcomingBatchesProps {
  upcomingBatches?: TrackableCollection[];
}

const MyLearningUpcomingBatches = ({ upcomingBatches = [] }: MyLearningUpcomingBatchesProps) => {
  const { t } = useAppI18n();

  // Limit to upcoming 10 batches
  const limitedBatches = upcomingBatches.slice(0, 10);

  // Group batches by date
  // Group batches by date
  const groupedBatches = limitedBatches.reduce((acc, course) => {
    const startDate = course.batch?.startDate;
    if (!startDate) return acc;

    const dateObj = new Date(startDate);
    // Format date as "Month DD" e.g., "Feb 12"
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        sortKey: dateObj.getTime(), // Use timestamp for reliable sorting
        batches: []
      };
    }
    
    // Determine background color based on index
    // Using subtle warm tints to match design
    const color = acc[dateStr].batches.length % 2 === 0 ? "mylearning-batch-bg-light" : "mylearning-batch-bg-alt";

    acc[dateStr].batches.push({
      courseId: course.courseId,
      title: course.courseName,
      lessons: course.leafNodesCount || 0,
      color: color
    });
    return acc;
  }, {} as Record<string, { date: string, sortKey: number, batches: any[] }>);

  const upcomingBatchesData = Object.values(groupedBatches).sort((a, b) => a.sortKey - b.sortKey);

  if (upcomingBatchesData.length === 0) {
     return (
        <div className="bg-white rounded-2xl p-6 shadow-sunbird-sm">
            <h3 className="text-[1.25rem] font-bold text-sunbird-obsidian mb-6 font-rubik">{t('common.upcomingBatches')}</h3>
            <div className="text-gray-500 text-sm">{t('myLearning.noUpcomingBatches')}</div>
        </div>
     )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sunbird-sm">
      {/* Header */}
      <h3 className="text-[1.25rem] font-bold text-sunbird-obsidian mb-6 font-rubik">{t('common.upcomingBatches')}</h3>

      {/* Batches by Date */}
      <div className="space-y-6">
        {upcomingBatchesData.map((dateGroup) => (
          <div key={dateGroup.date}>
            {/* Date Header */}
            <div className="text-[1.125rem] font-normal text-sunbird-obsidian mb-4 font-rubik">
              {dateGroup.date}
            </div>

            {/* Batches */}
            <div className="space-y-4">
              {dateGroup.batches.map((batchItem) => (
                <div
                  key={batchItem.courseId}
                  className={`flex ${batchItem.color} rounded-lg overflow-hidden min-h-[5.625rem]`}
                >
                  {/* Content Box */}
                  <div className="flex-1 py-4 pl-6 pr-6 flex flex-col justify-center">
                    <h4 className="text-[1rem] font-normal text-sunbird-obsidian mb-1.5 font-rubik leading-snug">
                      {batchItem.title}
                    </h4>
                    <div className="flex items-center gap-6 text-[0.875rem] text-gray-500 font-rubik">
                      <div className="flex items-center gap-1.5">
                        <FiBookOpen className="text-sunbird-brick w-[0.875rem] h-[0.875rem]" />
                        <span className="font-light">{batchItem.lessons} {t('contentStats.lessons')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyLearningUpcomingBatches;