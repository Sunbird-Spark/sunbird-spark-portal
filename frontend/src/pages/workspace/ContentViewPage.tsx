import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import PageLoader from '@/components/common/PageLoader';
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
import PublishWarningDialog from '@/components/workspace/PublishWarningDialog';
import ReviewPageHeader from '@/components/workspace/ReviewPageHeader';
import ContentPlayerSection from '@/components/workspace/ReviewPlayerSection';
import reviewCommentService from '@/services/ReviewCommentService';
import './ContentViewPage.css';

const contentService = new ContentService();
const formService = new FormService();
const WORKSPACE_QUERY_KEYS = ['workspace-counts', 'workspace-content'];

const ReviewPageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="content-review-background">
    <Header />
    <main className="content-review-container">{children}</main>
    <Footer />
  </div>
);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface ContentViewPageProps {
  mode: 'view' | 'review';
}

const ContentReviewPage = ({ mode }: ContentViewPageProps) => {
  const { contentId } = useParams();
  const isReviewMode = mode === 'review';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useAppI18n();
  const [dialogMode, setDialogMode] = useState<'publish' | 'request-changes' | null>(null);
  const [dialogFormFields, setDialogFormFields] = useState<CheckListFormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPublishForm, setIsLoadingPublishForm] = useState(false);
  const [isLoadingRequestChangesForm, setIsLoadingRequestChangesForm] = useState(false);
  const [showPublishWarning, setShowPublishWarning] = useState(false);

  const { data, isLoading, error } = useContentRead(contentId || '', { mode: 'edit' });
  const contentData = data?.data?.content;
  const isQumlContent =
    contentData?.mimeType === 'application/vnd.sunbird.questionset' ||
    contentData?.mimeType === 'application/vnd.sunbird.question';
  const isEcmlContent = contentData?.mimeType === 'application/vnd.ekstep.ecml-archive';

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

  const clearWorkspaceQueries = useCallback(() => {
    WORKSPACE_QUERY_KEYS.forEach((key) => queryClient.removeQueries({ queryKey: [key] }));
  }, [queryClient]);

  const loadFormAndShow = useCallback(async (
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
        toast({ title: t('workspace.review.errorTitle'), description: t('workspace.review.failedToLoadForm', { action }), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('workspace.review.errorTitle'), description: t('workspace.review.failedToLoadFormRetry', { action }), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const handlePublishClick = useCallback(async () => {
    if (!contentId || !contentData) return;

    // Only check for comments on ECML content
    if (isEcmlContent) {
      try {
        const hasComments = await reviewCommentService.hasComments({
          contentId,
          contentVer: contentData.versionKey || '0',
          contentType: contentData.mimeType || 'application/vnd.ekstep.ecml-archive',
        });

        if (hasComments) {
          setShowPublishWarning(true);
          return;
        }
      } catch (error) {
        console.error('Failed to check for comments:', error);
        // Proceed with publish if check fails
      }
    }

    // Proceed with publish
    loadFormAndShow('publish', 'publish', setIsLoadingPublishForm);
  }, [contentId, contentData, isEcmlContent, loadFormAndShow]);

  const handleRequestChangesClick = useCallback(() => {
    loadFormAndShow('request-changes', 'requestforchanges', setIsLoadingRequestChangesForm);
  }, [loadFormAndShow]);

  const closeDialog = useCallback(() => setDialogMode(null), []);

  const handlePublishConfirm = useCallback(async () => {
    if (!contentId || !contentData) return;
    setIsSubmitting(true);
    try {
      await contentService.contentPublish(contentId, userAuthInfoService.getUserId() || '');

      // Only delete comments for ECML content
      if (isEcmlContent) {
        try {
          await reviewCommentService.deleteComments({
            contentId,
            contentVer: contentData.versionKey || '0',
            contentType: contentData.mimeType || 'application/vnd.ekstep.ecml-archive',
          });
        } catch (error) {
          console.error('Failed to delete comments after publish:', error);
        }
      }

      closeDialog();
      toast({ title: t('workspace.review.publishedTitle'), description: t('workspace.review.publishedDescription'), variant: 'success' });
      clearWorkspaceQueries();
      navigate('/workspace');
    } catch {
      closeDialog();
      toast({ title: t('workspace.review.publishFailedTitle'), description: t('workspace.review.publishFailedDescription'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [contentId, contentData, isEcmlContent, closeDialog, toast, t, clearWorkspaceQueries, navigate]);

  const handleRequestChangesConfirm = useCallback(async (rejectReasons: string[], rejectComment: string) => {
    if (!contentId) return;
    setIsSubmitting(true);
    try {
      await contentService.contentReject(contentId, rejectReasons, rejectComment);
      closeDialog();
      toast({ title: t('workspace.review.changesRequestedTitle'), description: t('workspace.review.changesRequestedDescription'), variant: 'success' });
      clearWorkspaceQueries();
      navigate('/workspace');
    } catch {
      closeDialog();
      toast({ title: t('workspace.review.requestFailedTitle'), description: t('workspace.review.requestFailedDescription'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [contentId, closeDialog, toast, t, clearWorkspaceQueries, navigate]);

  const handleBack = useCallback(() => navigate('/workspace'), [navigate]);

  const handlePublishWarningConfirm = useCallback(() => {
    setShowPublishWarning(false);
    loadFormAndShow('publish', 'publish', setIsLoadingPublishForm);
  }, [loadFormAndShow]);

  if (playerIsLoading) return <PageLoader message={t('workspace.loadingContentReview')} />;
  if (playerError) return <ReviewPageLayout><p>{t('workspace.review.errorLoading', { error: playerError.message })}</p></ReviewPageLayout>;
  if (!playerMetadata) return <ReviewPageLayout><p>{t('workspace.review.contentNotFound')}</p></ReviewPageLayout>;
  if (isReviewMode && contentData?.status !== 'Review') {
    navigate('/workspace', { replace: true });
    return null;
  }

  return (
    <ReviewPageLayout>
      <ReviewPageHeader
        onBack={handleBack}
        isReviewMode={isReviewMode}
        onPublish={handlePublishClick}
        onRequestChanges={handleRequestChangesClick}
        isSubmitting={isSubmitting}
        isLoadingPublishForm={isLoadingPublishForm}
        isLoadingRequestChangesForm={isLoadingRequestChangesForm}
        dialogMode={dialogMode}
      />
      <ContentPlayerSection
        playerMetadata={playerMetadata}
        handlePlayerEvent={handlePlayerEvent}
        handleTelemetryEvent={handleTelemetryEvent}
        isEcmlContent={isEcmlContent}
        contentId={contentId}
        contentVer={contentData?.versionKey}
        contentType={contentData?.mimeType}
        isReviewMode={isReviewMode}
        contentName={contentData?.name}
      />
      <div className="content-review-details-section">
        {contentData?.description && (
          <p className="content-review-description">{contentData.description}</p>
        )}
        <div className="content-review-metadata-grid">
          <div>
            <span className="label">{t('workspace.createdBy')}</span>
            <span className="value">{contentData?.creator || t('workspace.review.notAvailable')}</span>
          </div>
          <div>
            <span className="label">{t('workspace.review.lastUpdated')}</span>
            <span className="value">{formatDate(contentData?.lastUpdatedOn) ?? t('workspace.review.notAvailable')}</span>
          </div>
          <div>
            <span className="label">{t('workspace.review.contentType')}</span>
            <span className="value">{contentData?.primaryCategory || contentData?.contentType || t('workspace.review.notAvailable')}</span>
          </div>
          <div>
            <span className="label">{t('workspace.createdOn')}</span>
            <span className="value">{formatDate(contentData?.createdOn) ?? t('workspace.review.notAvailable')}</span>
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
      <PublishWarningDialog
        isOpen={showPublishWarning}
        onClose={() => setShowPublishWarning(false)}
        onConfirm={handlePublishWarningConfirm}
        isLoading={isLoadingPublishForm}
      />
    </ReviewPageLayout>
  );
};

export default ContentReviewPage;
