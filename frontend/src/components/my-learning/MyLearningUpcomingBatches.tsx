import { Course } from "@/types/courseTypes";

const LessonIcon = () => (
  <svg width="0.875rem" height="0.875rem" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3C2 1.89543 2.89543 1 4 1H11C12.1046 1 13 1.89543 13 3V11C13 12.1046 12.1046 13 11 13H4C2.89543 13 2 12.1046 2 11V3Z" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M5 4H10" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 7H10" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 10H8" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

interface MyLearningUpcomingBatchesProps {
  upcomingBatches?: Course[];
}

const MyLearningUpcomingBatches = ({ upcomingBatches = [] }: MyLearningUpcomingBatchesProps) => {

  // Limit to upcoming 10 batches
  const limitedBatches = upcomingBatches.slice(0, 10);

  // Group batches by date
  const groupedBatches = limitedBatches.reduce((acc, course) => {
    const startDate = course.batch?.startDate;
    if (!startDate) return acc;

    const dateObj = new Date(startDate);
    // Format date as "Month DD" e.g., "Feb 12"
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    // Determine background color based on index
    const color = acc[dateStr].length % 2 === 0 ? "bg-[#FDF7FA]" : "bg-[#F3FAF7]";

    acc[dateStr].push({
      id: course.courseId,
      title: course.courseName,
      lessons: course.leafNodesCount || 0,
      color: color
    });
    return acc;
  }, {} as Record<string, any[]>);

  const upcomingBatchesData = Object.entries(groupedBatches).map(([date, batches]) => ({
    date,
    batches
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcomingBatchesData.length === 0) {
     return (
        <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="text-[1.25rem] font-bold text-[#222222] mb-6 font-['Rubik']">Upcoming Batches</h3>
            <div className="text-gray-500 text-sm">No upcoming batches scheduled.</div>
        </div>
     )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <h3 className="text-[1.25rem] font-bold text-[#222222] mb-6 font-['Rubik']">Upcoming Batches</h3>

      {/* Batches by Date */}
      <div className="space-y-6">
        {upcomingBatchesData.map((dateGroup) => (
          <div key={dateGroup.date}>
            {/* Date Header */}
            <div className="text-[1.125rem] font-normal text-[#222222] mb-4 font-['Rubik']">
              {dateGroup.date}
            </div>

            {/* Batches */}
            <div className="space-y-4">
              {dateGroup.batches.map((batchItem) => (
                <div
                  key={batchItem.id}
                  className={`flex ${batchItem.color} rounded-lg overflow-hidden min-h-[5.625rem]`}
                >
                  {/* Content Box */}
                  <div className="flex-1 py-4 px-6 flex flex-col justify-center">
                    <h4 className="text-[1rem] font-normal text-[#222222] mb-1.5 font-['Rubik'] leading-snug">
                      {batchItem.title}
                    </h4>
                    <div className="flex items-center gap-6 text-[0.875rem] text-[#6B7280] font-['Rubik']">
                      <div className="flex items-center gap-1.5">
                        <LessonIcon />
                        <span className="font-light">{batchItem.lessons} Lessons</span>
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