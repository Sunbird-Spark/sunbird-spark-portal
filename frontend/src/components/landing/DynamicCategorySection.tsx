import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { CategoryItem } from "@/types/formTypes";
import uiuxIcon from "@/assets/uiux-icon.svg";
import devIcon from "@/assets/dev-icon.svg"
import marketingIcon from "@/assets/marketing-icon.svg";
import entrepreneurIcon from "@/assets/entrepreneur-icon.svg";

interface DynamicCategorySectionProps {
  title: string;
  list?: CategoryItem[];
}

// Icon mapping based on category code for stability
const iconMap: Record<string, string> = {
  "technology": devIcon,
  "design": uiuxIcon,
  "marketing": marketingIcon,
  "business": entrepreneurIcon,
  "data": devIcon,
  // Fallback mappings for legacy title-based codes
  "uiux": uiuxIcon,
  "development": devIcon,
};

const getIconForCategory = (category: CategoryItem): string => {
  // Normalize code to lowercase for case-insensitive matching
  const normalizedCode = category.code?.toLowerCase() || '';
  
  // Try code-based lookup first (most stable)
  const iconByCode = iconMap[normalizedCode];
  if (iconByCode) {
    return iconByCode;
  }
  
  // Fallback to value-based lookup for backward compatibility
  if (category.value) {
    const iconByValue = iconMap[category.value];
    if (iconByValue) {
      return iconByValue;
    }
  }
  
  // Final fallback to default icon
  return devIcon;
};

const backgroundMap = [
  "var(--category-gradient-1)",
  "var(--category-gradient-2)",
  "var(--category-gradient-3)",
  "var(--category-gradient-4)",
];

const DynamicCategorySection = ({ title, list }: DynamicCategorySectionProps) => {
  if (!list || list.length === 0) return null;

  // Sort by index
  const sortedCategories = [...list].sort((a, b) => a.index - b.index);

  return (
    <section id="categories" className="pt-[2.5rem] pb-8 bg-white">
      <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal text-foreground">
            {title}
          </h2>
        </div>

        {/* Category Cards and Browse All */}
        <div className="flex items-center gap-6 pb-[1.875rem] flex-wrap justify-center lg:justify-between">
          <div className="flex items-center gap-4 flex-wrap justify-center lg:flex-nowrap">
            {sortedCategories.map((category, idx) => (
              <Link key={`${category.id}-${idx}`} to="/explore" className="group">
                <div
                  className="flex flex-col justify-between transition-transform hover:scale-[1.02] p-7 w-[14rem] h-[12.125rem] rounded-[1.25rem]"
                  style={{ background: backgroundMap[idx % backgroundMap.length] }}
                >
                  <div className="w-9 h-[0.1875rem] bg-white/90 rounded-full" />
                  <div className="flex flex-col gap-3">
                    <img src={getIconForCategory(category)} alt={category.title} className="w-8 h-8" />
                    <p className="text-[1.0625rem] font-bold text-white leading-tight">
                      {category.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            to="/explore"
            className="group flex flex-col items-center justify-center gap-3"
            style={{ paddingTop: '1.0625rem', paddingBottom: '0rem' }}
          >
            <div
              className="rounded-full text-white flex items-center justify-center transition-transform hover:scale-105 w-[3.6875rem] h-[3.6875rem] bg-sunbird-brick"
            >
              <FiArrowRight className="w-6 h-6" />
            </div>
            <span className="text-[0.875rem] font-bold text-foreground">
              View All
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DynamicCategorySection;
