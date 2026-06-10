import { useAppI18n } from "@/hooks/useAppI18n";
import SparkleIcon from "./SparkleIcon";

interface SemanticSuggestionsProps {
  onSelect: (query: string) => void;
}

const SemanticSuggestions = ({ onSelect }: SemanticSuggestionsProps) => {
  const { t } = useAppI18n();
  const suggestions = t("search.suggestions", { returnObjects: true }) as string[];

  return (
    <div className="flex flex-col items-center gap-5 py-8 px-4">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2 text-sunbird-brick">
          <SparkleIcon className="w-5 h-5 animate-pulse" />
          <span className="font-rubik font-semibold text-base">{t("search.semanticSuggestTitle")}</span>
          <SparkleIcon className="w-5 h-5 animate-pulse" />
        </div>
        <p className="font-rubik text-sm text-gray-400">{t("search.semanticSuggestSubtitle")}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white
              text-sm font-rubik text-gray-600 hover:border-sunbird-brick hover:text-sunbird-brick
              hover:bg-sunbird-brick/5 transition-all duration-150 shadow-sm hover:shadow"
          >
            <SparkleIcon className="w-3 h-3 text-gray-300 group-hover:text-sunbird-brick transition-colors" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SemanticSuggestions;
