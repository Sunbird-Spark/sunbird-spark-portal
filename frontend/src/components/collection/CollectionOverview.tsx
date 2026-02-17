import { FiPlay } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { CheckIcon } from "./CollectionIcons";
import type { CollectionData } from "@/types/collectionTypes";

interface CollectionOverviewProps {
  collectionData: CollectionData;
}

const CollectionOverview = ({ collectionData }: CollectionOverviewProps) => {
  const { t } = useAppI18n();

  return (
    <div className="space-y-6">
      {/* Video Player Card */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
        <div className="relative">
          {/* Video Thumbnail Container */}
          <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 relative ">
            <img
              src={collectionData.image}
              alt={collectionData.title}
              className="w-full h-full object-cover"
            />

            {/* Unit label - first module or none */}
            {collectionData.modules?.[0] && (
              <div className="absolute top-4 left-4 z-10">
                <span className="text-white text-base font-medium px-4 py-2 rounded-md">
                  {collectionData.modules[0].title}
                </span>
              </div>
            )}

            {/* Play Button */}
            <button
              type="button"
              aria-label={t("button.playVideo")}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-20"
            >
              <FiPlay className="w-6 h-6 text-sunbird-brick ml-1" fill="currentColor" />
            </button>
          </div>
        </div>


        {/* Course Overview Section */}
        <div className="px-6 pb-6 pt-0">
          <h2 className="text-xl font-bold text-foreground mb-4">{t("courseDetails.overview")}</h2>

          {/* Stats: Units & Lessons */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sunbird-brick">
                <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="text-black font-bold">
                {collectionData.modules?.length ?? 0}
              </span>
              {t("courseDetails.units")}
            </span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sunbird-brick">
                <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8H11M5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-black font-bold">{collectionData.lessons}</span> {t("contentStats.lessons")}
            </span>
          </div>

          <p className="text-base text-[#222222] leading-relaxed mb-6">
            {collectionData.description}
          </p>

          {/* Best Suited For */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">{t("courseDetails.suitedFor")}</h3>
            <ul className="space-y-3">
              {collectionData.audience.map((role, index) => (
                <li key={index} className="flex items-start gap-2 text-base text-muted-foreground">
                  <CheckIcon />
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionOverview;
