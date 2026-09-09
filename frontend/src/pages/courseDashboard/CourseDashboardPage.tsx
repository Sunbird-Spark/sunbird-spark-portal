import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import PageLoader from '@/components/common/PageLoader';
import { useCollection } from '@/hooks/useCollection';
import { useCurrentUserId, useIsMentor } from '@/hooks/useUser';
import { useBatchListForMentor } from '@/hooks/useBatch';
import BatchesTab from './BatchesTab';
import CertificatesTab from './CertificatesTab';
import { useAppI18n } from '@/hooks/useAppI18n';
import useImpression from '@/hooks/useImpression';
import useInteract from '@/hooks/useInteract';
import { TelemetryTracker } from '@/components/telemetry/TelemetryTracker';
import './courseDashboard.css';

type DashboardTab = 'batches' | 'certificates';

const VALID_TABS: DashboardTab[] = ['batches', 'certificates'];

const CourseDashboardPage: React.FC = () => {
  const { t } = useAppI18n();
  const { collectionId, pathId, tab } = useParams<{ collectionId?: string; pathId?: string; tab: string }>();
  // Same page serves both /collection/:collectionId/dashboard/:tab and
  // /learning-path/:pathId/dashboard/:tab - a Learning Path id is just another
  // collection id as far as the batch/certificate/report APIs are concerned.
  const isLearningPath = !!pathId;
  const contentId = pathId ?? collectionId;
  const basePath = isLearningPath ? `/learning-path/${pathId}` : `/collection/${collectionId}`;
  const objectType = isLearningPath ? 'Learning Path' : 'Course';
  useImpression({ type: 'view', pageid: 'course-dashboard', env: 'course', object: { id: contentId || '', type: objectType } });
  const navigate = useNavigate();

  const { data: collectionData, isLoading, isError, error } = useCollection(contentId);
  const { data: currentUserId } = useCurrentUserId();
  const isOwner =
    !!collectionData?.createdBy &&
    !!currentUserId &&
    collectionData.createdBy === currentUserId;

  useImpression({ type: 'view', pageid: 'course-dashboard', object: { id: contentId || '', type: 'Collection' } });
  const { interact } = useInteract();

  const isMentorRole = useIsMentor();
  const { data: mentorBatches, isLoading: isMentorBatchesLoading } = useBatchListForMentor(contentId, { enabled: isMentorRole });
  const isMentorOfCourse = !!mentorBatches && mentorBatches.length > 0;

  const canAccessDashboard = isOwner || isMentorOfCourse;

  // Enforce access control: redirect if not authorized after data has loaded
  const isPermissionDetermining = isLoading || isMentorBatchesLoading;

  useEffect(() => {
    if (!isPermissionDetermining && collectionData && currentUserId !== undefined) {
      if (!canAccessDashboard) {
        navigate(basePath, { replace: true });
      }
    }
  }, [canAccessDashboard, isPermissionDetermining, collectionData, currentUserId, basePath, navigate]);

  // Redirect to default tab if the tab param is invalid
  useEffect(() => {
    if (tab && !VALID_TABS.includes(tab as DashboardTab)) {
      navigate(`${basePath}/dashboard/batches`, { replace: true });
    }
  }, [tab, basePath, navigate]);

  const activeTab: DashboardTab = VALID_TABS.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : 'batches';

  const switchTab = (t: DashboardTab) => {
    interact({ id: 'course-dashboard-tab-switch', type: 'CLICK', pageid: 'course-dashboard', cdata: [{ id: t, type: 'Tab' }] });
    navigate(`${basePath}/dashboard/${t}`);
  };

  const courseName = collectionData?.title ?? '';
  const backLabel = isLearningPath ? t('courseDashboard.backToPathPage') : t('courseDashboard.backToCoursePage');
  const dashboardTitle = isLearningPath ? t('learningPath.dashboardTitle') : t('courseDashboard.title');
  const manageDashboardLabel = isLearningPath ? t('learningPath.manageDashboard') : t('courseDashboard.manageDashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gray-100" data-testid="dashboard-page">
      <TelemetryTracker 
        startEventInput={{ type: 'workflow', mode: 'course-dashboard', pageid: 'course-dashboard-page' }}
        endEventInput={{ type: 'workflow', mode: 'course-dashboard', pageid: 'course-dashboard-exit' }}
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sunbird-theme-accent text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          data-testid="back-to-course-btn"
        >
          <FiArrowLeft className="w-4 h-4" />
          {backLabel}
        </button>

        {/* ─── Loading / error for collection name and permissions ─── */}
        {isPermissionDetermining && (
          <div className="mb-6">
            <PageLoader message={t('courseDashboard.checkingPermissions')} fullPage={false} />
          </div>
        )}
        {!isPermissionDetermining && isError && (
          <div className="mb-6">
            <PageLoader error={(error as Error)?.message ?? t('courseDashboard.failedToLoad')} fullPage={false} />
          </div>
        )}

        {!isPermissionDetermining && !isError && (
          <div className="flex flex-col mb-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground max-w-[75%]" data-testid="dashboard-title">
                {courseName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{dashboardTitle}</span>
            </div>
          </div>
        )}

        {/* ─── Main Box ─── */}
        {!isPermissionDetermining && !isError && (
          <div className="bg-white rounded-2xl shadow-sunbird-sm border border-border flex flex-col min-h-[372px]">
            {/* ─── Header area of Box ─── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground font-rubik">
                {manageDashboardLabel}
              </p>
            </div>

            {/* ─── Tab bar ─── */}
            <div className="flex border-b border-border" data-testid="tab-bar">
              <button
                className={`flex-1 py-2.5 text-sm font-rubik font-medium relative transition-colors ${
                  activeTab === 'batches'
                    ? 'text-sunbird-theme-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => switchTab('batches')}
                data-testid="tab-batches"
              >
                {t('tabs.batches')}
                {activeTab === 'batches' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-theme-accent rounded-t-full" />
                )}
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-rubik font-medium relative transition-colors ${
                  activeTab === 'certificates'
                    ? 'text-sunbird-theme-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => switchTab('certificates')}
                data-testid="tab-certificates"
              >
                {t('tabs.reissueCertificate')}
                {activeTab === 'certificates' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-theme-accent rounded-t-full" />
                )}
              </button>
            </div>

            {/* ─── Tab content ─── */}
            <div className="flex flex-col bg-white rounded-2xl">
              {contentId && activeTab === 'batches' && (
                <BatchesTab
                  collectionId={contentId}
                  emptyHint={isLearningPath ? t('learningPath.selectBatchHint') : undefined}
                />
              )}
              {contentId && activeTab === 'certificates' && (
                <CertificatesTab collectionId={contentId} canReissue={canAccessDashboard} />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CourseDashboardPage;
