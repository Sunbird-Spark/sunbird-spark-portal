import { FiBookOpen, FiUsers, FiAward } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { useAppI18n } from "@/hooks/useAppI18n";

const StatsSection = () => {
  const { t } = useAppI18n();

  const stats = [
    {
      icon: FiBookOpen,
      value: "500+",
      label: t("coursesAvailable"),
      description: "Expert-designed curriculum",
    },
    {
      icon: FiUsers,
      value: "50,000+",
      label: t("activeLearners"),
      description: "Growing community",
    },
    {
      icon: FiAward,
      value: "100+",
      label: t("expertInstructors"),
      description: "Industry recognized",
    },
    {
      icon: HiOutlineBuildingOffice2,
      value: "95%",
      label: t("completionRate"),
      description: "Trusted by enterprises",
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            {t("trustedByProfessionals")}
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            {t("joinThousands")}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/20 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-medium text-primary-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xs md:text-sm text-primary-foreground/60">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
