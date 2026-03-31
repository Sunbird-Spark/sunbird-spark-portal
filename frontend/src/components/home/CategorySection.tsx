import { FiArrowRight } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { Link } from "react-router-dom";
import uiuxIcon from "@/assets/uiux-icon.svg";
import devIcon from "@/assets/dev-icon.svg"
import marketingIcon from "@/assets/marketing-icon.svg";
import entrepreneurIcon from "@/assets/entrepreneur-icon.svg";

const CategorySection = () => {
  const { t } = useAppI18n();

  const categories = [
    {
      id: "ui-ux-design",
      icon: uiuxIcon,
      background: "var(--category-gradient-1)",
    },
    {
      id: "it-development",
      icon: devIcon,
      background: "var(--category-gradient-2)",
    },
    {
      id: "digital-marketing",
      icon: marketingIcon,
      background: "var(--category-gradient-3)",
    },
    {
      id: "entrepreneurship",
      icon: entrepreneurIcon,
      background: "var(--category-gradient-4)",
    },
  ];

  return (
    <section id="categories" className="pt-[2.5rem] pb-8 bg-white">
      <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal text-foreground">
            {t("browseCategories")}
          </h2>
        </div>

        {/* Category Cards and Browse All */}
        <div className="flex items-center gap-6 pb-[1.875rem] flex-wrap justify-center lg:justify-between">
          <div className="flex items-center gap-4 flex-wrap justify-center lg:flex-nowrap">
            {categories.map((category) => (
              <Link key={category.id} to="/explore" className="group">
                <div
                  className="flex flex-col justify-between transition-transform hover:scale-[1.02] p-7 w-[14rem] h-[12.125rem] rounded-[1.25rem]"
                  style={{ background: category.background }}
                >
                  {/* Top-left white horizontal line */}
                  <div className="w-9 h-[0.1875rem] bg-white/90 rounded-full" />

                  {/* Bottom content: Icon + Label */}
                  <div className="flex flex-col gap-3">
                    <img src={category.icon} alt={t(`categoriesList.${category.id}`)} className="w-8 h-8" />
                    <p className="text-[1.0625rem] font-bold text-white leading-tight">
                      {t(`categoriesList.${category.id}`)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Browse All Button */}
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
              {t("viewAll")}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
