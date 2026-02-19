import { useAppI18n } from "@/hooks/useAppI18n";
import { CheckIcon } from "./CollectionIcons";
import type { CollectionData } from "@/types/collectionTypes";
import { ContentPlayer } from "@/components/players";
import PageLoader from "@/components/common/PageLoader";

interface CollectionOverviewProps {
  collectionData: CollectionData;
  contentId?: string;
  playerMetadata?: any;
  playerIsLoading?: boolean;
  playerError?: Error | null;
  onPlayerEvent?: (event: any) => void;
  onTelemetryEvent?: (event: any) => void;
}

const CollectionOverview = ({
  collectionData,
  contentId,
  playerMetadata,
  playerIsLoading,
  playerError,
  onPlayerEvent,
  onTelemetryEvent,
}: CollectionOverviewProps) => {
  const { t } = useAppI18n();

  return (
    <div className="space-y-6">
      {/* Player Card */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
          {contentId ? (
            /* Content Player */
            <div>
              {playerIsLoading && (
                <div className="aspect-video flex items-center justify-center bg-gray-100">
                  <PageLoader message={t("loading")} fullPage={false} />
                </div>
              )}
              {!playerIsLoading && playerError && (
                <div className="aspect-video flex items-center justify-center bg-gray-100">
                  <p className="text-sm text-red-500">{playerError.message}</p>
                </div>
              )}
              {!playerIsLoading && !playerError && playerMetadata && (
                <ContentPlayer
                  mimeType={playerMetadata.mimeType}
                  metadata={playerMetadata}
                  onPlayerEvent={onPlayerEvent}
                  onTelemetryEvent={onTelemetryEvent}
                />
              )}
            </div>
          ) : (
            /* No Content Error */
            <div className="aspect-video flex items-center justify-center bg-gray-100">
              <PageLoader 
                error={t("error.contentNotAvailable")} 
                onRetry={() => window.location.reload()} 
                fullPage={false} 
              />
            </div>
          )}


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
