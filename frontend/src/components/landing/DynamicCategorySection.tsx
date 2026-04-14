import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { CategoryItem } from "@/types/formTypes";
import { useAppI18n } from "@/hooks/useAppI18n";
import { resolveTitleText } from "@/utils/i18nUtils";
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
  const { currentCode, t } = useAppI18n();
  
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
            {sortedCategories.map((category, idx) => {
              const categoryTitle = resolveTitleText(category.title, currentCode);
              return (
                <Link key={`${category.id}-${idx}`} to="/explore" className="group">
                  <div
                    className="category-card"
                    style={{ background: backgroundMap[idx % backgroundMap.length] }}
                  >
                    <div className="category-card-bar" />
                    <div className="category-card-body">
                      <p className="category-card-title">{categoryTitle}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            to="/explore"
            className="category-view-all-link group"
            style={{ paddingTop: '1.0625rem', paddingBottom: '0rem' }}
          >
            <div className="category-view-all-circle">
              <FiArrowRight className="category-view-all-icon" />
            </div>
            <span className="category-view-all-label">{t('viewAll')}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DynamicCategorySection;
