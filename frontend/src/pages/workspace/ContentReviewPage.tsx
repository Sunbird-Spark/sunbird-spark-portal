import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft } from 'react-icons/fi';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import PageLoader from '@/components/common/PageLoader';
import { ContentPlayer as PlayerComponent } from '@/components/players';
import { useContentPlayer } from '@/hooks/useContentPlayer';
import { useContentRead } from '@/hooks/useContent';
import { useQumlContent } from '@/hooks/useQumlContent';
import { ContentService } from '@/services/ContentService';
import { FormService } from '@/services/FormService';
import { CheckListFormField } from '@/types/formTypes';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { useToast } from '@/hooks/useToast';
import { useAppI18n } from '@/hooks/useAppI18n';
import ChecklistDialog from '@/components/workspace/ChecklistDialog';
import './ContentReviewPage.css';

const contentService = new ContentService();
const formService = new FormService();
const WORKSPACE_QUERY_KEYS = ['workspace-counts', 'workspace-content'];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ReviewPageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="content-review-background">
    <Header />
    <main className="content-review-container">{children}</main>
    <Footer />
  </div>
);

const ContentReviewPage = () => {
  const { t } = useAppI18n();
  const { contentId } = useParams();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('mode') === 'review';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogMode, setDialogMode] = useState<'publish' | 'request-changes' | null>(null);
  const [dialogFormFields, setDialogFormFields] = useState<CheckListFormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPublishForm, setIsLoadingPublishForm] = useState(false);
  const [isLoadingRequestChangesForm, setIsLoadingRequestChangesForm] = useState(false);

  const { data, isLoading, error } = useContentRead(contentId || '', { mode: 'edit' });
  const contentData = data?.data?.content;
  const isQumlContent =
    contentData?.mimeType === 'application/vnd.sunbird.questionset' ||
    contentData?.mimeType === 'application/vnd.sunbird.question';

  const {
    data: qumlData,
    isLoading: isQumlLoading,
    error: qumlError,
  } = useQumlContent(contentId || '', { enabled: isQumlContent });

  const playerMetadata = isQumlContent ? qumlData : contentData;
  const playerIsLoading = isQumlContent ? isQumlLoading : isLoading;
  const playerError = isQumlContent ? qumlError : error;

  const onPlayerEvent = useCallback((event: any) => {
    console.log('Review player event:', event);
  }, []);
  const onTelemetryEvent = useCallback((event: any) => {
    console.log('Review telemetry event:', event);
  }, []);
  const { handlePlayerEvent, handleTelemetryEvent } = useContentPlayer({
    onPlayerEvent,
    onTelemetryEvent,
  });

  const memoizedPlayer = useMemo(() => {
    if (!playerMetadata) return null;
    return (
      <div className="content-review-player-section">
        <div className="content-review-player-wrapper">
          <div className="content-review-player-inner">
            <PlayerComponent
              mimeType={playerMetadata.mimeType}
              metadata={playerMetadata}
              onPlayerEvent={handlePlayerEvent}
              onTelemetryEvent={handleTelemetryEvent}
            />
          </div>
        </div>
      </div>
    );
  }, [playerMetadata, handlePlayerEvent, handleTelemetryEvent]);

  const clearWorkspaceQueries = () => {
    WORKSPACE_QUERY_KEYS.forEach((key) => queryClient.removeQueries({ queryKey: [key] }));
  };

  const loadFormAndShow = async (
    mode: 'publish' | 'request-changes',
    action: string,
    setLoading: (loading: boolean) => void,
  ) => {
    setLoading(true);
    try {
      const response = await formService.formRead({
        type: 'content', action, subType: 'resource', rootOrgId: '*',
      });
      if (response.data?.form?.data?.fields) {
        setDialogFormFields(response.data.form.data.fields);
        setDialogMode(mode);
      } else {
        toast({ title: 'Error', description: `Failed to load ${action} form.`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: `Failed to load ${action} form. Please try again.`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishClick = () =>
    loadFormAndShow('publish', 'publish', setIsLoadingPublishForm);

  const handleRequestChangesClick = () =>
    loadFormAndShow('request-changes', 'requestforchanges', setIsLoadingRequestChangesForm);

  const closeDialog = () => setDialogMode(null);

  const handlePublishConfirm = async () => {
    if (!contentId) return;
    setIsSubmitting(true);
    try {
      await contentService.contentPublish(contentId, userAuthInfoService.getUserId() || '');
      closeDialog();
      toast({ title: 'Published', description: 'Content has been published successfully.' });
      clearWorkspaceQueries();
      navigate('/workspace');
    } catch {
      closeDialog();
      toast({ title: 'Publish Failed', description: 'Unable to publish content. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChangesConfirm = async (rejectReasons: string[], rejectComment: string) => {
    if (!contentId) return;
    setIsSubmitting(true);
    try {
      await contentService.contentReject(contentId, rejectReasons, rejectComment);
      closeDialog();
      toast({ title: 'Changes Requested', description: 'Request for changes has been submitted successfully.' });
      clearWorkspaceQueries();
      navigate('/workspace');
    } catch {
      closeDialog();
      toast({ title: 'Request Failed', description: 'Unable to submit request for changes. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (playerIsLoading) return <PageLoader message={t('workspace.loadingContentReview')} />;
  if (playerError) return <ReviewPageLayout><p>{t('content.errorLoading', { error: playerError.message })}</p></ReviewPageLayout>;
  if (!playerMetadata) return <ReviewPageLayout><p>{t('content.notFound')}</p></ReviewPageLayout>;

  return (
    <ReviewPageLayout>
      <div className="content-review-button-container">
        <button onClick={() => navigate('/workspace')} className="content-review-go-back">
          <FiArrowLeft /> {t('back')}
        </button>
        {isReviewMode && (
          <div className="content-review-actions">
            <button
              className="content-review-btn-publish"
              onClick={handlePublishClick}
              disabled={isSubmitting || isLoadingPublishForm}
            >
              {isLoadingPublishForm ? 'Loading...' : isSubmitting && dialogMode === 'publish' ? 'Publishing...' : 'Publish'}
            </button>
            <button
              className="content-review-btn-reject"
              onClick={handleRequestChangesClick}
              disabled={isSubmitting || isLoadingRequestChangesForm}
            >
              {isLoadingRequestChangesForm ? 'Loading...' : 'Request for Changes'}
            </button>
          </div>
        )}
      </div>
      <div className="content-player-title-row">
        <h1 className="content-player-title">{contentData?.name}</h1>
      </div>
      {memoizedPlayer}
      <div className="content-review-details-section">
        {contentData?.description && (
          <p className="content-review-description">{contentData.description}</p>
        )}
        <div className="content-review-metadata-grid">
          <div>
            <span className="label">{t('workspace.createdBy')}</span>
            <span className="value">{contentData?.creator || 'Unknown'}</span>
          </div>
          <div>
            <span className="label">{t('lastUpdated')}</span>
            <span className="value">{formatDate(contentData?.lastUpdatedOn)}</span>
          </div>
          <div>
            <span className="label">{t('contentType')}</span>
            <span className="value">{contentData?.primaryCategory || contentData?.contentType || 'N/A'}</span>
          </div>
          <div>
            <span className="label">{t('workspace.createdOn')}</span>
            <span className="value">{formatDate(contentData?.createdOn)}</span>
          </div>
        </div>
      </div>
      {dialogMode && (
        <ChecklistDialog
          isOpen={true}
          onClose={closeDialog}
          onPublish={dialogMode === 'publish' ? handlePublishConfirm : undefined}
          onRequestChanges={dialogMode === 'request-changes' ? handleRequestChangesConfirm : undefined}
          formFields={dialogFormFields}
          isLoading={isSubmitting}
          mode={dialogMode}
        />
      )}
    </ReviewPageLayout>
  );
};

export default ContentReviewPage;
