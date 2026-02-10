import { FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import CategoryCard from "./CategoryCard";
import { categories } from "@/configs/mockData";
import { useAppI18n } from "@/hooks/useAppI18n";
import { Link } from "react-router-dom";

const CategorySection = () => {
  const { t } = useAppI18n();

  return (
    <section id="categories" className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {t("browseCategories")}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Explore our diverse range of professional training categories
            </p>
          </div>
          <Link to="/courses">
            <Button variant="ghost" className="text-primary hover:text-primary/90 self-start md:self-auto">
              {t("viewAll")}
              <FiArrowRight className="w-4 h-4 ms-2" />
            </Button>
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;