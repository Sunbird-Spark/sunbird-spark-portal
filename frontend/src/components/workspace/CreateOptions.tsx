import { useAppI18n } from "@/hooks/useAppI18n";
import { getEditorCategories, BOOK_CREATOR_ALLOWED_OPTIONS } from "@/services/workspace";

interface CreateOptionsProps {
  onOptionSelect: (optionId: string) => void;
  /** When true, only textbook options are enabled; all others are disabled */
  isBookCreator?: boolean;
}

const CreateOptions = ({ onOptionSelect, isBookCreator = false }: CreateOptionsProps) => {
  const { t } = useAppI18n();

  const editorCategories = getEditorCategories(isBookCreator);

  const isOptionDisabled = (optionId: string): boolean => {
    if (!isBookCreator) return false;
    return !BOOK_CREATOR_ALLOWED_OPTIONS.includes(optionId);
  };

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
                const disabled = isOptionDisabled(option.id);
                return (
                  <div key={option.id} className="relative group/option">
                    <button
                      onClick={() => !disabled && onOptionSelect(option.id)}
                      disabled={disabled}
                      className={`w-full text-left p-4 rounded-xl border border-transparent transition-all duration-200 group ${
                        disabled
                          ? 'bg-gray-100/60 opacity-50 cursor-not-allowed'
                          : 'bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${option.iconBg} flex items-center justify-center shrink-0 ${disabled ? '' : 'group-hover:scale-105'} transition-transform`}>
                          <Icon className={`w-5 h-5 ${disabled ? 'text-gray-400' : option.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm font-rubik mb-0.5 transition-colors ${
                            disabled ? 'text-gray-400' : 'text-foreground group-hover:text-sunbird-brick'
                          }`}>
                            {option.title}
                          </h4>
                          <p className={`text-xs leading-relaxed font-rubik line-clamp-2 ${
                            disabled ? 'text-gray-400' : 'text-muted-foreground'
                          }`}>
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                    {/* Tooltip for disabled options */}
                    {disabled && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/option:opacity-100 transition-opacity pointer-events-none z-10">
                        {t("workspace.noAccessToCreate")}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-2 h-2 bg-gray-800 rotate-45" />
                      </div>
                    )}
                  </div>
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
