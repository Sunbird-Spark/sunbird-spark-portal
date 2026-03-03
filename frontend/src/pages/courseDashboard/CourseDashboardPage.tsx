import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import PageLoader from '@/components/common/PageLoader';
import { useCollection } from '@/hooks/useCollection';
import BatchesTab from './BatchesTab';
import CertificatesTab from './CertificatesTab';
import { useAppI18n } from '@/hooks/useAppI18n';
import useImpression from '@/hooks/useImpression';
import useInteract from '@/hooks/useInteract';
import './courseDashboard.css';

type DashboardTab = 'batches' | 'certificates';

const VALID_TABS: DashboardTab[] = ['batches', 'certificates'];

const CourseDashboardPage: React.FC = () => {
  const { t } = useAppI18n();
  const { collectionId, tab } = useParams<{ collectionId: string; tab: string }>();
  const navigate = useNavigate();

  const { data: collectionData, isLoading, isError, error } = useCollection(collectionId);

  useImpression({ type: 'view', pageid: 'course-dashboard', object: { id: collectionId || '', type: 'Collection' } });
  const { interact } = useInteract();

  // Redirect to default tab if the tab param is invalid
  useEffect(() => {
    if (tab && !VALID_TABS.includes(tab as DashboardTab)) {
      navigate(`/collection/${collectionId}/dashboard/batches`, { replace: true });
    }
  }, [tab, collectionId, navigate]);

  const activeTab: DashboardTab = VALID_TABS.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : 'batches';

  const switchTab = (t: DashboardTab) => {
    interact({ id: 'course-dashboard-tab-switch', type: 'CLICK', pageid: 'course-dashboard', cdata: [{ id: t, type: 'Tab' }] });
    navigate(`/collection/${collectionId}/dashboard/${t}`);
  };

  const courseName = collectionData?.title ?? '';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100" data-testid="dashboard-page">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          data-testid="back-to-course-btn"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Course Page
        </button>

        {/* ─── Loading / error for collection name ─── */}
        {isLoading && (
          <div className="mb-6">
            <PageLoader message="Loading course…" fullPage={false} />
          </div>
        )}
        {!isLoading && isError && (
          <div className="mb-6">
            <PageLoader error={(error as Error)?.message ?? 'Failed to load course.'} fullPage={false} />
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex flex-col mb-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground max-w-[75%]" data-testid="dashboard-title">
                {courseName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t('courseDashboard.title')}</span>
            </div>
          </div>
        )}

        {/* ─── Main Box ─── */}
        <div className="bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border flex flex-col">
          
          {/* ─── Header area of Box ─── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground font-['Rubik']">
              Manage dashboard for this course
            </p>
          </div>

          {/* ─── Tab bar ─── */}
          <div className="flex border-b border-border" data-testid="tab-bar">
            <button
              className={`flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors ${
                activeTab === 'batches'
                  ? 'text-sunbird-brick'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => switchTab('batches')}
              data-testid="tab-batches"
            >
              {t('tabs.batches')}
              {activeTab === 'batches' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
              )}
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors ${
                activeTab === 'certificates'
                  ? 'text-sunbird-brick'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => switchTab('certificates')}
              data-testid="tab-certificates"
            >
              {t('tabs.certificates')}
              {activeTab === 'certificates' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
              )}
            </button>
          </div>

          {/* ─── Tab content ─── */}
          <div className="flex flex-col bg-white">
            {collectionId && activeTab === 'batches' && (
              <BatchesTab collectionId={collectionId} />
            )}
            {collectionId && activeTab === 'certificates' && (
              <CertificatesTab collectionId={collectionId} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseDashboardPage;
