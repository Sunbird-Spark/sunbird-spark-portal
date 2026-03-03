import { useAppI18n } from "@/hooks/useAppI18n";
import { getEditorCategories } from "@/services/workspace";

interface CreateOptionsProps {
  onOptionSelect: (optionId: string) => void;
}

const CreateOptions = ({ onOptionSelect }: CreateOptionsProps) => {
  const { t } = useAppI18n();

  const editorCategories = getEditorCategories();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-sunbird-ginger/10 via-sunbird-wave/10 to-sunbird-moss/10 rounded-[1.25rem] p-6 md:p-8 border border-sunbird-ginger/20">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground font-rubik mb-2">
          {t("createOptions.title")}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base font-rubik">
          {t("createOptions.description")}
        </p>
      </div>

      {/* Editor Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {editorCategories.map((category) => (
          <div
            key={category.id}
            className={`bg-white rounded-[1.25rem] border-2 ${category.borderColor} shadow-md overflow-hidden`}
          >
            {/* Category Header */}
            <div className={`${category.accentColor} px-5 py-4`} style={category.headerStyle}>
              <h3 className="text-lg font-semibold text-white font-rubik">
                {category.title}
              </h3>
              <p className="text-white/80 text-sm font-rubik">
                {category.subtitle}
              </p>
            </div>

            {/* Options List */}
            <div className="p-4 space-y-3">
              {category.options.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => onOptionSelect(option.id)}
                    className="w-full text-left p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${option.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${option.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm font-rubik mb-0.5 group-hover:text-sunbird-brick transition-colors">
                          {option.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-rubik line-clamp-2">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateOptions;
