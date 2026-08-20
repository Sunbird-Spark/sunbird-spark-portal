import { useAppI18n } from "@/hooks/useAppI18n";
import type { LearningTypeFilter } from "./MyLearningCourses";

interface MyLearningProgressProps {
  /** Which tab is selected - the Learning Path tab shows Skills/Paths stats instead of Lessons/Contents. */
  typeFilter?: LearningTypeFilter;
  lessonsVisited: number;
  totalLessons: number;
  contentsCompleted: number;
  totalContents: number;
  /** Only meaningful (and only rendered) when `typeFilter === 'learningPath'` - see useMySkills(). */
  skillsGained?: number;
  skillsTotal?: number;
  pathsCompleted?: number;
  pathsTotal?: number;
}

const MyLearningProgress = ({
  typeFilter = 'course',
  lessonsVisited = 0,
  totalLessons = 0,
  contentsCompleted = 0,
  totalContents = 0,
  skillsGained = 0,
  skillsTotal = 0,
  pathsCompleted = 0,
  pathsTotal = 0,
}: MyLearningProgressProps) => {
  const { t } = useAppI18n();
  const isLearningPathTab = typeFilter === 'learningPath';
  // Outer/inner ring values swap to Skills/Learning Paths on the Learning Path
  // tab - see bug: Skills Count and Learning Path Count showing the same
  // numbers as the Course tab instead of their own real counts.
  const outerValue = isLearningPathTab ? skillsGained : lessonsVisited;
  const outerTotal = isLearningPathTab ? skillsTotal : totalLessons;
  const innerValue = isLearningPathTab ? pathsCompleted : contentsCompleted;
  const innerTotal = isLearningPathTab ? pathsTotal : totalContents;
  const outerLabel = isLearningPathTab ? t('myLearning.skillsGained') : t('myLearning.lessonVisited');
  const innerLabel = isLearningPathTab ? t('myLearning.learningPathsCompleted') : t('myLearning.contentsCompleted');
  const totalHours = outerValue;

  const compactNumberFormatter = new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const formatCompact = (n: number): string => compactNumberFormatter.format(n);

  const getCenterFontSize = (hoursDisplay: string): string => {
    if (hoursDisplay.length <= 3) return '1.5rem';
    if (hoursDisplay.length <= 4) return '1.1rem';
    return '0.875rem';
  };
  const displayHours = formatCompact(totalHours);
  const centerFontSize = getCenterFontSize(displayHours);
  // SVG Donut chart calculations
  const size = 140; 
  const center = size / 2;
  const strokeWidth = 12; // Increased to be more prominent
  
  // Outer circle (Lessons, or Skills gained on the Learning Path tab)
  const outerRadius = 58;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerPercentage = outerTotal > 0 ? (outerValue / outerTotal) : 0;
  // Ensure a small segment is visible if progress is 0 but lessons exist? No, follows data.
  const outerStrokeDasharray = `${outerPercentage * outerCircumference} ${outerCircumference}`;

  // Inner circle (Contents, or Learning Paths completed on the Learning Path tab)
  const innerRadius = 34; // Slightly more gap
  const innerCircumference = 2 * Math.PI * innerRadius;
  const innerPercentage = innerTotal > 0 ? (innerValue / innerTotal) : 0;
  const innerStrokeDasharray = `${innerPercentage * innerCircumference} ${innerCircumference}`;

  return (
    <div className="mylearning-donut-container">
      {/* Header */}
      <h3 className="text-[1.25rem] font-semibold text-sunbird-obsidian mb-6 font-rubik">{t('myLearning.learningProgress')}</h3>

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
              className="mylearning-donut-ring-bg"
              strokeWidth={strokeWidth}
            />
            {/* Inner Background Ring */}
            <circle 
              cx={center} 
              cy={center} 
              r={innerRadius} 
              fill="none" 
              className="mylearning-donut-ring-bg"
              strokeWidth={strokeWidth}
            />
            
            {/* Outer Progress (Lessons) - Light Brown/Gold */}
            <circle 
              cx={center} 
              cy={center} 
              r={outerRadius} 
              fill="none" 
              className="mylearning-donut-ring-outer"
              strokeWidth={strokeWidth}
              strokeDasharray={outerStrokeDasharray}
              strokeLinecap="round"
              transform={`rotate(-45 ${center} ${center})`}
            />

            {/* Inner Progress (Contents) - Dark Brown */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              className="mylearning-donut-ring-inner"
              strokeWidth={strokeWidth}
              strokeDasharray={innerStrokeDasharray}
              strokeLinecap="round"
              transform={`rotate(135 ${center} ${center})`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: centerFontSize }} className="font-bold text-sunbird-obsidian font-rubik leading-none">{displayHours}</span>
          </div>
        </div>

        {/* Stats Legend */}
        <div className="flex-1 space-y-6 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-[hsl(var(--sunbird-learning-outer))] rounded-full"></div>
            </div>
            <div className="text-[1.125rem] font-bold text-sunbird-obsidian mb-0.5 font-rubik">
              {outerValue}/{outerTotal}
            </div>
            <div className="text-[0.875rem] text-gray-500 font-rubik">
              {outerLabel}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-[hsl(var(--sunbird-learning-inner))] rounded-full"></div>
            </div>
            <div className="text-[1.125rem] font-bold text-[hsl(var(--sunbird-learning-inner))] mb-0.5 font-rubik">
              {innerValue}/{innerTotal}
            </div>
            <div className="text-[0.875rem] text-gray-500 font-rubik">
              {innerLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLearningProgress;