import { useState, useRef, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import useDebounce from "@/hooks/useDebounce";
import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchItem } from "@/types/workspaceTypes";
import CollectionCard from "@/components/content/CollectionCard";
import ResourceCard from "@/components/content/ResourceCard";
import PageLoader from "@/components/common/PageLoader";

const COLLECTION_MIME_TYPE = "application/vnd.ekstep.content-collection";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 600);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { t } = useAppI18n();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useContentSearch({
    request: {
      limit: 3,
      query: debouncedQuery || "", // Empty string to fetch default results
      filters: { objectType: ["Content", "QuestionSet"] },
    },
    enabled: isOpen,
  });

  const results: ContentSearchItem[] = [
    ...(data?.data?.content ?? []),
    ...(data?.data?.QuestionSet ?? []),
  ];

  // Store the previously focused element and restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      inputRef.current?.focus();
    } else {
      setQuery("");
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap: keep focus within the dialog
      if (e.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) return;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
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
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t("search_for_content_placeholder")}
    >
      {/* White search panel */}
      <div className="bg-white shadow-sunbird-sm flex flex-col max-h-[55vh] md:max-h-[85vh]">
        <div className="flex-shrink-0 container mx-auto px-4 lg:px-[3.75rem] pt-5 pb-6">
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
        </div>

        {/* Results section — scrolls independently within the panel */}
        <div className="overflow-y-auto flex-1 container mx-auto px-4 lg:px-[3.75rem] pb-4 md:pb-6">
          <h2 className="font-rubik font-semibold text-[1.25rem] md:text-[1.5rem] leading-[2rem] text-foreground mb-4">
            {sectionTitle}
          </h2>

          {isLoading ? (
            <div className="min-h-[8rem]">
              <PageLoader message={t("loading")} fullPage={false} />
            </div>
          ) : error ? (
            <div className="min-h-[8rem]">
              <PageLoader
                error={error.message || t("failed_to_search")}
                onRetry={() => refetch()}
                fullPage={false}
              />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((item) => (
                  <div key={item.identifier} onClick={onClose}>
                    {item.mimeType === COLLECTION_MIME_TYPE ? (
                      <CollectionCard item={item} />
                    ) : (
                      <ResourceCard item={item} />
                    )}
                  </div>
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
            <div className="flex justify-center items-center min-h-[8rem]">
              <p className="text-muted-foreground text-2xl">{t("no_results_found")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dimmed backdrop over remaining page — always visible below the panel */}
      <div
        className="flex-1 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  );
};

export default SearchModal;
