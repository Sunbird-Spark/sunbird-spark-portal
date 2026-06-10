import { useRef, forwardRef, useImperativeHandle } from "react";
import { FiX, FiSearch } from "react-icons/fi";
import { SearchMode } from "@/types/workspaceTypes";
import { useAppI18n } from "@/hooks/useAppI18n";
import SparkleIcon from "./SparkleIcon";

interface SearchModeToggleProps {
  query: string;
  onQueryChange: (value: string) => void;
  searchMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  placeholder?: string;
  className?: string;
}

const SearchModeToggle = forwardRef<HTMLInputElement, SearchModeToggleProps>(
  ({ query, onQueryChange, searchMode, onModeChange, placeholder, className = "" }, ref) => {
    const { t } = useAppI18n();
    const localRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => localRef.current!);

    const isSemantic = searchMode === "semantic";

    return (
      <div className={`flex items-center gap-2 w-full ${className}`}>
        {/* Left icon — magnifying glass for keyword, sparkle for semantic */}
        <span
          className={`flex-shrink-0 w-5 h-5 ${isSemantic ? "text-sunbird-brick animate-pulse" : "text-gray-400"}`}
          aria-hidden="true"
        >
          {isSemantic ? <SparkleIcon className="w-5 h-5" /> : <FiSearch className="w-5 h-5" />}
        </span>

        {/* Search input */}
        <input
          ref={localRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder ?? t("search_for_content_placeholder")}
          className="flex-1 min-w-0 outline-none font-rubik text-base text-gray-700 placeholder-gray-400 bg-transparent"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              localRef.current?.focus();
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t("clear_search")}
          >
            <FiX className="w-4 h-4" />
          </button>
        )}

        {/* AI Search toggle pill */}
        <button
          type="button"
          onClick={() => onModeChange(isSemantic ? "keyword" : "semantic")}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-rubik font-medium transition-colors whitespace-nowrap ${
            isSemantic
              ? "bg-sunbird-brick text-white"
              : "text-gray-500 border border-gray-200 hover:bg-gray-50"
          }`}
          aria-pressed={isSemantic}
        >
          <SparkleIcon className="w-3.5 h-3.5" />
          {t("search.semanticMode")}
        </button>

      </div>
    );
  }
);

SearchModeToggle.displayName = "SearchModeToggle";

export default SearchModeToggle;
