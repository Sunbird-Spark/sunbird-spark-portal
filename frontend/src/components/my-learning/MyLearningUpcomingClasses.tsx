const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M7 4V7L9 8.5" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StudentsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="4" r="2" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M1 11C1 9.34315 2.34315 8 4 8H6C7.65685 8 9 9.34315 9 11" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="4.5" r="1.5" stroke="#A85236" strokeWidth="1.5"/>
    <path d="M10 8C11.6569 8 13 9.34315 13 11" stroke="#A85236" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const upcomingClassesData = [
  {
    date: "Feb 12",
    classes: [
      { id: "1", time: "20:00", title: "Business Decisions and Analytics", duration: "1hr", students: 100, color: "bg-[#FDF7FA]" },
      { id: "2", time: "18:00", title: "Types of Business Analytics", duration: "3hrs", students: 200, color: "bg-[#F3FAF7]" },
    ],
  },
  {
    date: "March 05",
    classes: [
      { id: "3", time: "09:00", title: "Applications of Business Analytics", duration: "2hrs", students: 500, color: "bg-[#FDF7FA]" },
      { id: "4", time: "08:00", title: "Data Science Overview", duration: "2.5hrs", students: 400, color: "bg-[#F3FAF7]" },
    ],
  },
];

const MyLearningUpcomingClasses = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <h3 className="text-[20px] font-bold text-[#222222] mb-6 font-['Rubik']">Upcoming Classes</h3>

      {/* Classes by Date */}
      <div className="space-y-6">
        {upcomingClassesData.map((dateGroup) => (
          <div key={dateGroup.date}>
            {/* Date Header */}
            <div className="text-[18px] font-normal text-[#222222] mb-4 font-['Rubik']">
              {dateGroup.date}
            </div>

            {/* Classes */}
            <div className="space-y-4">
              {dateGroup.classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className={`flex ${classItem.color} rounded-lg overflow-hidden min-h-[90px]`}
                >
                  {/* Time Box */}
                  <div className="w-[100px] flex items-center justify-center relative">
                    <span className="text-[16px] text-[#6B7280] font-normal font-['Rubik']">
                      {classItem.time}
                    </span>
                    {/* Vertical Divider Line */}
                    <div className="absolute right-0 top-5 bottom-5 w-[1px] bg-gray-200/60"></div>
                  </div>

                  {/* Content Box */}
                  <div className="flex-1 py-4 pl-6 pr-4 flex flex-col justify-center">
                    <h4 className="text-[16px] font-normal text-[#222222] mb-1.5 font-['Rubik'] leading-snug">
                      {classItem.title}
                    </h4>
                    <div className="flex items-center gap-6 text-[14px] text-[#6B7280] font-['Rubik']">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon />
                        <span className="font-light">{classItem.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StudentsIcon />
                        <span className="font-light">{classItem.students} Students</span>
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

export default MyLearningUpcomingClasses;