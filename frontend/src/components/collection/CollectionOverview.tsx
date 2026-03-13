import { useAppI18n } from "@/hooks/useAppI18n";
import dayjs from "dayjs";
import { CheckIcon } from "./CollectionIcons";
import type { CollectionData } from "@/types/collectionTypes";
import { ContentPlayer } from "@/components/players";
import PageLoader from "@/components/common/PageLoader";
import { Toaster } from "@/components/common/Toaster";

interface CollectionOverviewProps {
  collectionData: CollectionData;
  contentId?: string;
  /** When true (trackable + not logged in or not enrolled), show join message instead of player/error. */
  contentAccessBlocked?: boolean;
  /** When true (enrolled in upcoming batch), show batch-not-started-yet message instead of player. */
  upcomingBatchBlocked?: boolean;
  batchStartDate?: string;
  showMaxAttemptsExceeded?: boolean;
  playerMetadata?: any;
  playerIsLoading?: boolean;
  playerError?: Error | null;
  onPlayerEvent?: (event: any) => void;
  onTelemetryEvent?: (event: any) => void;
}

const CollectionOverview = ({
  collectionData,
  contentId,
  contentAccessBlocked = false,
  upcomingBatchBlocked = false,
  batchStartDate,
  showMaxAttemptsExceeded = false,
  playerMetadata,
  playerIsLoading,
  playerError,
  onPlayerEvent,
  onTelemetryEvent,
}: CollectionOverviewProps) => {
  const { t } = useAppI18n();

  return (
    <div className="collection-overview-container">
      <div className="collection-player-card relative">
        <Toaster viewport="center" viewportClassName="!fixed !top-4 !left-1/2 !-translate-x-1/2 !right-auto !bottom-auto !max-w-[420px] z-[100]" />
        <div>
          {contentAccessBlocked ? (
            <div className="collection-player-wrapper">
              <div className="collection-player-loading">
                <p className="text-center text-muted-foreground text-sm px-4">
                  {t("courseDetails.mustJoinToAccessContent")}
                </p>
              </div>
            </div>
          ) : upcomingBatchBlocked ? (
            <div className="collection-player-wrapper">
              <div className="collection-player-loading">
                <p className="text-center text-muted-foreground text-sm px-4">
                  {batchStartDate
                    ? t("courseDetails.batchNotStartedYet", {
                        date: dayjs(batchStartDate).format("DD MMM YYYY"),
                      })
                    : t("courseDetails.batchNotStartedYetNoDate")}
                </p>
              </div>
            </div>
          ) : showMaxAttemptsExceeded ? (
            <div className="collection-player-wrapper">
              <div className="collection-player-loading flex flex-col items-center justify-center py-8 px-4">
                <p className="text-center text-muted-foreground text-sm">
                  {t("courseDetails.selfAssessMaxAttempt")}
                </p>
              </div>
            </div>
          ) : contentId ? (
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
              {!playerIsLoading && !playerError && playerMetadata && (() => {
                const isVideoMime = ['video/webm', 'video/mp4'].includes(playerMetadata.mimeType);
                return (
                  <div className={isVideoMime ? undefined : 'collection-player-content'}>
                    <ContentPlayer
                      mimeType={playerMetadata.mimeType}
                      metadata={playerMetadata}
                      onPlayerEvent={onPlayerEvent}
                      onTelemetryEvent={onTelemetryEvent}
                    />
                  </div>
                );
              })()}
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
        </div>

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
                {collectionData.children?.length ?? 0}
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
