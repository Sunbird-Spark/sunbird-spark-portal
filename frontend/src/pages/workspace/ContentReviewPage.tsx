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
import ChecklistDialog from '@/components/workspace/ChecklistDialog';
import './ContentReviewPage.css';

const contentService = new ContentService();
const formService = new FormService();
const WORKSPACE_QUERY_KEYS = ['workspace-counts', 'workspace-own-counts', 'workspace-content'];

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
  const { contentId } = useParams();
  const [searchParams] = useSearchParams();
  const isReviewMode = searchParams.get('mode') === 'review';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false);
  const [publishFormFields, setPublishFormFields] = useState<CheckListFormField[]>([]);
  const [requestChangesFormFields, setRequestChangesFormFields] = useState<CheckListFormField[]>([]);
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

  const invalidateWorkspaceQueries = () =>
    Promise.all(WORKSPACE_QUERY_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));

  const loadFormAndShow = async (
    action: string,
    setFields: (fields: CheckListFormField[]) => void,
    setShow: (show: boolean) => void,
    setLoading: (loading: boolean) => void,
    fallback?: () => Promise<void>,
  ) => {
    setLoading(true);
    try {
      const response = await formService.formRead({
        type: 'content', action, subType: 'resource', rootOrgId: '*',
      });
      if (response.data?.form?.data?.fields) {
        setFields(response.data.form.data.fields);
        setShow(true);
      } else if (fallback) {
        await fallback();
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
    loadFormAndShow('publish', setPublishFormFields, setShowPublishDialog, setIsLoadingPublishForm, handlePublishConfirm);

  const handleRequestChangesClick = () =>
    loadFormAndShow('requestforchanges', setRequestChangesFormFields, setShowRequestChangesDialog, setIsLoadingRequestChangesForm);

  const handlePublishConfirm = async () => {
    if (!contentId) return;
    setIsPublishing(true);
    try {
      await contentService.contentPublish(contentId, userAuthInfoService.getUserId() || '');
      setShowPublishDialog(false);
      toast({ title: 'Success', description: 'Content is published successfully.' });
      await invalidateWorkspaceQueries();
      navigate('/workspace');
    } catch {
      setShowPublishDialog(false);
      toast({ title: 'Error', description: 'Failed to publish content.', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRequestChangesConfirm = async (rejectReasons: string[], rejectComment: string) => {
    if (!contentId) return;
    setIsRejecting(true);
    try {
      await contentService.contentReject(contentId, rejectReasons, rejectComment);
      setShowRequestChangesDialog(false);
      toast({ title: 'Success', description: 'Request for changes is submitted successfully.' });
      await invalidateWorkspaceQueries();
      navigate('/workspace');
    } catch {
      setShowRequestChangesDialog(false);
      toast({ title: 'Error', description: 'Failed to request for changes.', variant: 'destructive' });
    } finally {
      setIsRejecting(false);
    }
  };

  if (playerIsLoading) return <PageLoader message="Loading content for review..." />;
  if (playerError) return <ReviewPageLayout><p>Error loading content: {playerError.message}</p></ReviewPageLayout>;
  if (!playerMetadata) return <ReviewPageLayout><p>Content not found</p></ReviewPageLayout>;

  return (
    <ReviewPageLayout>
      <div className="content-review-button-container">
        <button onClick={() => navigate('/workspace')} className="content-review-go-back">
          <FiArrowLeft /> Back
        </button>
        {isReviewMode && (
          <div className="content-review-actions">
            <button
              className="content-review-btn-publish"
              onClick={handlePublishClick}
              disabled={isPublishing || isRejecting || isLoadingPublishForm}
            >
              {isLoadingPublishForm ? 'Loading...' : isPublishing ? 'Publishing...' : 'Publish'}
            </button>
            <button
              className="content-review-btn-reject"
              onClick={handleRequestChangesClick}
              disabled={isPublishing || isRejecting || isLoadingRequestChangesForm}
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
            <span className="label">Created By</span>
            <span className="value">{contentData?.creator || 'Unknown'}</span>
          </div>
          <div>
            <span className="label">Last Updated</span>
            <span className="value">{formatDate(contentData?.lastUpdatedOn)}</span>
          </div>
          <div>
            <span className="label">Content Type</span>
            <span className="value">{contentData?.primaryCategory || contentData?.contentType || 'N/A'}</span>
          </div>
          <div>
            <span className="label">Created On</span>
            <span className="value">{formatDate(contentData?.createdOn)}</span>
          </div>
        </div>
      </div>
      <ChecklistDialog
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onPublish={handlePublishConfirm}
        formFields={publishFormFields}
        isLoading={isPublishing}
        mode="publish"
      />
      <ChecklistDialog
        isOpen={showRequestChangesDialog}
        onClose={() => setShowRequestChangesDialog(false)}
        onRequestChanges={handleRequestChangesConfirm}
        formFields={requestChangesFormFields}
        isLoading={isRejecting}
        mode="request-changes"
      />
    </ReviewPageLayout>
  );
};

export default ContentReviewPage;
