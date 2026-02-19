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
    <div className="collection-overview-container">
      {/* Player Card */}
      <div className="collection-player-card">
          {contentId ? (
            /* Content Player */
            <div className="collection-player-wrapper">
              {playerIsLoading && (
                <div className="collection-player-loading">
                  <PageLoader message={t("loading")} fullPage={false} />
                </div>
              )}
              {!playerIsLoading && playerError && (
                <div className="collection-player-error">
                  <p className="collection-player-error-text">{playerError.message}</p>
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
            <div className="collection-player-error">
              <PageLoader 
                error={t("noContentFound")} 
                onRetry={() => window.location.reload()} 
                fullPage={false} 
              />
            </div>
          )}


        {/* Course Overview Section */}
        <div className="collection-overview-section">
          <h2 className="collection-overview-title">{t("courseDetails.overview")}</h2>

          {/* Stats: Units & Lessons */}
          <div className="collection-stats-container">
            <span className="collection-stat-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="collection-stat-icon">
                <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="collection-stat-value">
                {collectionData.modules?.length ?? 0}
              </span>
              {t("courseDetails.units")}
            </span>
            <span className="collection-stat-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="collection-stat-icon">
                <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8H11M5 11H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="collection-stat-value">{collectionData.lessons}</span> {t("contentStats.lessons")}
            </span>
          </div>

          <p className="collection-description">
            {collectionData.description}
          </p>

          {/* Best Suited For */}
          <div>
            <h3 className="collection-suited-title">{t("courseDetails.suitedFor")}</h3>
            <ul className="collection-audience-list">
              {collectionData.audience.map((role, index) => (
                <li key={index} className="collection-audience-item">
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
