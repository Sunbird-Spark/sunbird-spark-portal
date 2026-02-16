const MyLearningHoursSpent = () => {
  const totalHours = 130;
  const lessonsVisited = { current: 10, total: 30 };
  const contentsCompleted = { current: 2, total: 10 };

  // SVG Donut chart calculations
  const size = 140; // Increased overall size
  const center = size / 2;
  const strokeWidth = 14; // Thicker strokes
  
  // Outer circle (Lessons)
  const outerRadius = 58;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const lessonsPercentage = lessonsVisited.current / lessonsVisited.total;
  const lessonsStrokeDasharray = `${lessonsPercentage * outerCircumference} ${outerCircumference}`;
  
  // Inner circle (Contents)
  const innerRadius = 36; // Significantly smaller for more gap
  const innerCircumference = 2 * Math.PI * innerRadius;
  const contentsPercentage = contentsCompleted.current / contentsCompleted.total;
  const contentsStrokeDasharray = `${contentsPercentage * innerCircumference} ${innerCircumference}`;

  return (
    <div className="bg-[#FFF8DE] rounded-2xl p-6">
      {/* Header */}
      <h3 className="text-[20px] font-semibold text-[#222222] mb-6 font-['Rubik']">Total Hrs Spent</h3>

      <div className="flex items-center gap-8">
        {/* Double Donut Chart */}
        <div className="relative flex-shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
            <span className="text-[18px] font-bold text-[#222222] font-['Rubik']">{totalHours}</span>
          </div>
        </div>

        {/* Stats Legend */}
        <div className="flex-1 space-y-6 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-[#D48952] rounded-full"></div>
            </div>
            <div className="text-[18px] font-bold text-[#222222] mb-0.5 font-['Rubik']">
              {lessonsVisited.current}/{lessonsVisited.total}
            </div>
            <div className="text-[14px] text-[#6B7280] font-['Rubik']">
              Lesson visited
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-[#A05E29] rounded-full"></div>
            </div>
            <div className="text-[18px] font-bold text-[#222222] mb-0.5 font-['Rubik']">
              {contentsCompleted.current}/{contentsCompleted.total}
            </div>
            <div className="text-[14px] text-[#6B7280] font-['Rubik']">
              Contents completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLearningHoursSpent;