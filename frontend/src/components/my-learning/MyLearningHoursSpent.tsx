interface MyLearningHoursSpentProps {
  lessonsVisited: number;
  totalLessons: number;
  contentsCompleted: number;
  totalContents: number;
}

const MyLearningHoursSpent = ({ 
  lessonsVisited = 0, 
  totalLessons = 0, 
  contentsCompleted = 0, 
  totalContents = 0 
}: MyLearningHoursSpentProps) => {
  // Using lessonsVisited as the main "stats" number for now since we don't have duration.
  // Or we could pass strict "hours" if available.
  const totalHours = lessonsVisited; 

  // SVG Donut chart calculations
  const size = 140; // Increased overall size
  const center = size / 2;
  const strokeWidth = 8; // Matched to w-8 h-2 bar 
  
  // Outer circle (Lessons)
  const outerRadius = 58;
  const outerCircumference = 2 * Math.PI * outerRadius;
  // Protect against divide by zero
  const lessonsPercentage = totalLessons > 0 ? (lessonsVisited / totalLessons) : 0;
  const lessonsStrokeDasharray = `${lessonsPercentage * outerCircumference} ${outerCircumference}`;
  
  // Inner circle (Contents)
  const innerRadius = 36; // Significantly smaller for more gap
  const innerCircumference = 2 * Math.PI * innerRadius;
  const contentsPercentage = totalContents > 0 ? (contentsCompleted / totalContents) : 0;
  const contentsStrokeDasharray = `${contentsPercentage * innerCircumference} ${innerCircumference}`;

  return (
    <div className="bg-[#FFF8DE] rounded-2xl p-6">
      {/* Header */}
      <h3 className="text-[1.25rem] font-semibold text-[#222222] mb-6 font-['Rubik']">Learning Progress</h3>

      <div className="flex items-center gap-8">
        {/* Double Donut Chart */}
        <div className="relative flex-shrink-0" style={{ width: '8.75rem', height: '8.75rem' }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
            {/* Outer Background Ring */}
            <circle 
              cx={center} 
              cy={center} 
              r={outerRadius} 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth={strokeWidth}
            />
            {/* Inner Background Ring */}
            <circle 
              cx={center} 
              cy={center} 
              r={innerRadius} 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth={strokeWidth}
            />
            
            {/* Outer Progress (Lessons) - Light Brown/Gold */}
            <circle 
              cx={center} 
              cy={center} 
              r={outerRadius} 
              fill="none" 
              stroke="#D48952" 
              strokeWidth={strokeWidth}
              strokeDasharray={lessonsStrokeDasharray}
              strokeLinecap="round"
              transform={`rotate(-45 ${center} ${center})`}
            />
            
            {/* Inner Progress (Contents) - Dark Brown */}
            <circle 
              cx={center} 
              cy={center} 
              r={innerRadius} 
              fill="none" 
              stroke="#A05E29" 
              strokeWidth={strokeWidth}
              strokeDasharray={contentsStrokeDasharray}
              strokeLinecap="round"
              transform={`rotate(135 ${center} ${center})`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[1.125rem] font-bold text-[#222222] font-['Rubik']">{totalHours}</span>
          </div>
        </div>

        {/* Stats Legend */}
        <div className="flex-1 space-y-6 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-[#D48952] rounded-full"></div>
            </div>
            <div className="text-[1.125rem] font-bold text-[#222222] mb-0.5 font-['Rubik']">
              {lessonsVisited}/{totalLessons}
            </div>
            <div className="text-[0.875rem] text-[#6B7280] font-['Rubik']">
              Lesson visited
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-[#A05E29] rounded-full"></div>
            </div>
            <div className="text-[1.125rem] font-bold text-[#222222] mb-0.5 font-['Rubik']">
              {contentsCompleted}/{totalContents}
            </div>
            <div className="text-[0.875rem] text-[#6B7280] font-['Rubik']">
              Contents completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLearningHoursSpent;