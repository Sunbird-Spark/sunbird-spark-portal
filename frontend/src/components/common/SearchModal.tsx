import { useState, useRef, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/common/Badge";
import { useAppI18n } from "@/hooks/useAppI18n";
import useDebounce from "@/hooks/useDebounce";
import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchItem } from "@/types/workspaceTypes";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const badgeStyle =
  "bg-[#FFF1C7] text-foreground font-rubik font-medium text-[0.875rem] leading-[1.125rem] border-[#CC8545] border-[0.0625rem]";

const SearchResultCard = ({
  item,
  onClose,
  t,
}: {
  item: ContentSearchItem;
  onClose: () => void;
  t: (key: string) => string;
}) => (
  <Link
    to={`/collection/${item.identifier}`}
    onClick={onClose}
    className="group bg-white rounded-[1.25rem] overflow-hidden shadow-[0.125rem_0.125rem_1.25rem_0rem_rgba(0,0,0,0.09)] hover:shadow-lg transition-all duration-300 no-underline flex flex-col"
  >
    <div className="px-5 pt-5">
      <div className="relative overflow-hidden rounded-[1.25rem] h-[10.125rem]">
        {item.appIcon ? (
          <img
            src={item.appIcon}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 rounded-[1.25rem]" />
        )}
      </div>
    </div>

    <div className="px-5 pt-4 pb-5 flex flex-col flex-grow">
      {item.primaryCategory && (
        <Badge
          className={`inline-flex items-center justify-center p-0 rounded-[2.25rem] mb-4 h-[1.875rem] px-3 w-fit ${badgeStyle}`}
        >
          {item.primaryCategory}
        </Badge>
      )}
      <h3 className="font-rubik font-medium text-[1.125rem] leading-[1.625rem] text-foreground flex-grow">
        {item.name || t("untitled")}
      </h3>
    </div>
  </Link>
);

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useAppI18n();
  const navigate = useNavigate();

  const { data, isLoading } = useContentSearch({
    request: {
      limit: 3,
      query: debouncedQuery,
      filters: { objectType: "Content" },
    },
    enabled: isOpen,
  });

  const results: ContentSearchItem[] = data?.data?.content ?? [];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleViewMore = () => {
    onClose();
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  };

  const sectionTitle = debouncedQuery.trim()
    ? t("results_for", { query: debouncedQuery })
    : t("recommended");

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* White search panel */}
      <div className="bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <div className="container mx-auto px-4 lg:px-[3.75rem] pt-5 pb-6">
          {/* Search bar row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
              <FiSearch className="w-5 h-5 text-sunbird-brick flex-shrink-0" />
              <div className="w-px h-5 bg-gray-300" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_for_content_placeholder")}
                className="flex-1 outline-none font-rubik text-base text-gray-700 placeholder-gray-400 bg-transparent"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label={t("clear_search")}
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-sunbird-brick font-rubik font-medium text-base hover:text-sunbird-brick/80 transition-colors whitespace-nowrap"
            >
              {t("cancel")}
            </button>
          </div>

          {/* Results section */}
          <div className="mt-8">
            <h2 className="font-rubik font-semibold text-[1.5rem] leading-[2rem] text-foreground mb-5">
              {sectionTitle}
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sunbird-brick" />
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((item) => (
                    <SearchResultCard
                      key={item.identifier}
                      item={item}
                      onClose={onClose}
                      t={t}
                    />
                  ))}
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleViewMore}
                    className="flex items-center gap-2 font-rubik font-medium text-sunbird-brick hover:opacity-80 transition-opacity"
                  >
                    {t("view_all_results")}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t("no_results_found")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dimmed backdrop over remaining page */}
      <div className="flex-1 bg-black/20" onClick={onClose} />
    </div>
  );
};

export default SearchModal;
