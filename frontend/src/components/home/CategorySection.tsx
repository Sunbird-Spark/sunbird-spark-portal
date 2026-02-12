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
      name: "UI/UX Design",
      icon: uiuxIcon,
      background: "linear-gradient(to right, #45C0ED, #8E46C5)",
    },
    {
      id: "it-development",
      name: "IT Development",
      icon: devIcon,
      background: "linear-gradient(to right, #D55E1D, #F6C35C)",
    },
    {
      id: "digital-marketing",
      name: "Digital Marketing",
      icon: marketingIcon,
      background: "linear-gradient(to right, #1D79D5, #6ED97B)",
    },
    {
      id: "entrepreneurship",
      name: "Entrepreneurship",
      icon: entrepreneurIcon,
      background: "linear-gradient(to right, #F59C84, #D655E7)",
    },
  ];

  return (
    <section id="categories" className="pt-[40px] pb-8 bg-white">
      <div className="w-full pl-[127px] pr-[127px]">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-rubik font-medium text-[26px] leading-[26px] tracking-normal text-foreground">
            {t("browseCategories")}
          </h2>
        </div>

        {/* Category Cards and Browse All */}
        <div className="flex items-center gap-6 pb-[30px] flex-wrap justify-between">
          <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
            {categories.map((category) => (
              <Link key={category.id} to="/explore" className="group">
                <div
                  className="flex flex-col justify-between transition-transform hover:scale-[1.02] p-7 w-[224px] h-[194px] rounded-[20px]"
                  style={{ background: category.background }}
                >
                  {/* Top-left white horizontal line */}
                  <div className="w-9 h-[3px] bg-white/90 rounded-full" />

                  {/* Bottom content: Icon + Label */}
                  <div className="flex flex-col gap-3">
                    <img src={category.icon} alt={category.name} className="w-8 h-8" />
                    <p className="text-[17px] font-bold text-white leading-tight">
                      {category.name}
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
            style={{ paddingTop: '17px', paddingBottom: '0px' }}
          >
            <div
              className="rounded-full text-white flex items-center justify-center transition-transform hover:scale-105 w-[59px] h-[59px] bg-sunbird-brick"
            >
              <FiArrowRight className="w-6 h-6" />
            </div>
            <span className="text-[14px] font-bold text-foreground">
              {t("viewAll")}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
