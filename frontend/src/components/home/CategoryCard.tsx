import { IconType } from "react-icons";
import { Card } from "@/components/common/Card";
import { useAppI18n } from "@/hooks/useAppI18n";

export interface Category {
  id: string;
  name: string;
  icon: IconType;
  courseCount: number;
  color: string;
}

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const Icon = category.icon;
  const { t } = useAppI18n();

  return (
    <Card className="group cursor-pointer overflow-hidden border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300 bg-card">
      <div className="p-6 flex flex-col items-center text-center">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: category.color + "20" }}
        >
          <Icon
            className="w-7 h-7 transition-colors"
            style={{ color: category.color }}
          />
        </div>
        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {category.courseCount} {t("coursesCount")}
        </p>
      </div>
    </Card>
  );
};

export default CategoryCard;
