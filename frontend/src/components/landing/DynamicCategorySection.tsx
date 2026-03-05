import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { CategoryItem } from "@/types/formTypes";
import uiuxIcon from "@/assets/uiux-icon.svg";
import devIcon from "@/assets/dev-icon.svg"
import marketingIcon from "@/assets/marketing-icon.svg";
import entrepreneurIcon from "@/assets/entrepreneur-icon.svg";
import "./landing.css";

interface DynamicCategorySectionProps {
  title: string;
  list?: CategoryItem[];
  innerClassName?: string;
}


const backgroundMap = [
  "var(--category-gradient-1)",
  "var(--category-gradient-2)",
  "var(--category-gradient-3)",
  "var(--category-gradient-4)",
];

const DynamicCategorySection = ({ title, list, innerClassName = "landing-section-inner" }: DynamicCategorySectionProps) => {
  if (!list || list.length === 0) return null;

  // Sort by index
  const sortedCategories = [...list].sort((a, b) => a.index - b.index);

  return (
    <section id="categories" className="category-section">
      <div className={innerClassName}>
        <div className="category-section-header">
          <h2 className="category-section-title">{title}</h2>
        </div>

        <div className="category-section-cards-row">
          <div className="category-section-cards-group">
            {sortedCategories.map((category, idx) => (
              <Link key={`${category.id}-${idx}`} to="/explore" className="group">
                <div
                  className="category-card"
                  style={{ background: backgroundMap[idx % backgroundMap.length] }}
                >
                  <div className="category-card-bar" />
                  <div className="category-card-body">
                    <p className="category-card-title">{category.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            to="/explore"
            className="category-view-all-link group"
            style={{ paddingTop: '1.0625rem', paddingBottom: '0rem' }}
          >
            <div className="category-view-all-circle">
              <FiArrowRight className="category-view-all-icon" />
            </div>
            <span className="category-view-all-label">View All</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DynamicCategorySection;
