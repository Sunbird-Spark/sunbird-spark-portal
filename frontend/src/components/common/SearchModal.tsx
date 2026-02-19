import { useState, useRef, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import useDebounce from "@/hooks/useDebounce";
import { useContentSearch } from "@/hooks/useContent";
import { ContentSearchItem } from "@/types/workspaceTypes";
import CollectionCard from "@/components/content/CollectionCard";
import ResourceCard from "@/components/content/ResourceCard";

const COLLECTION_MIME_TYPE = "application/vnd.ekstep.content-collection";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useAppI18n();
  const navigate = useNavigate();

  const { data, isLoading } = useContentSearch({
    request: {
      limit: 3,
      query: debouncedQuery || "", // Empty string to fetch default results
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
                  aria-label="Clear search"
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
              <div className="flex justify-center items-center py-8 min-h-[20rem]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sunbird-brick" />
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
              <div className="flex justify-center items-center min-h-[20rem]">
                <p className="text-muted-foreground text-2xl">{t("no_results_found")}</p>
              </div>
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
