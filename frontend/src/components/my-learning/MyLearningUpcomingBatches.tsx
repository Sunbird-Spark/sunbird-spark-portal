import { Course } from "@/types/courseTypes";

const ClockIcon = () => (
  <svg width="0.875rem" height="0.875rem" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M7 4V7L9 8.5" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StudentsIcon = () => (
  <svg width="0.875rem" height="0.875rem" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="4" r="2" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M1 11C1 9.34315 2.34315 8 4 8H6C7.65685 8 9 9.34315 9 11" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="4.5" r="1.5" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M10 8C11.6569 8 13 9.34315 13 11" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
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
      time: "09:00", // Time is not available in API response, defaulting
      title: course.courseName,
      duration: "1hr", // Duration not available, defaulting
      students: 0, // Enrollment count not available in this API, defaulting
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
                  {/* Time Box */}
                  <div className="w-[6.25rem] flex items-center justify-center relative">
                    <span className="text-[1rem] text-[#6B7280] font-normal font-['Rubik']">
                      {batchItem.time}
                    </span>
                    {/* Vertical Divider Line */}
                    <div className="absolute right-0 top-5 bottom-5 w-[1px] bg-gray-200/60"></div>
                  </div>

                  {/* Content Box */}
                  <div className="flex-1 py-4 pl-6 pr-4 flex flex-col justify-center">
                    <h4 className="text-[1rem] font-normal text-[#222222] mb-1.5 font-['Rubik'] leading-snug">
                      {batchItem.title}
                    </h4>
                    <div className="flex items-center gap-6 text-[0.875rem] text-[#6B7280] font-['Rubik']">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon />
                        <span className="font-light">{batchItem.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StudentsIcon />
                        <span className="font-light">{batchItem.students} Students</span>
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