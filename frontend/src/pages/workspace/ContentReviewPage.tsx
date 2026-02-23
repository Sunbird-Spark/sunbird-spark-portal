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
import { FormField } from '@/types/formTypes';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { useToast } from '@/hooks/useToast';
import ChecklistDialog from '@/components/workspace/ChecklistDialog';
import './content-review.css';

const contentService = new ContentService();
const formService = new FormService();

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ContentReviewPage = () => {
  const { contentId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'view';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false);
  const [publishFormFields, setPublishFormFields] = useState<FormField[]>([]);
  const [requestChangesFormFields, setRequestChangesFormFields] = useState<FormField[]>([]);
  const [isLoadingPublishForm, setIsLoadingPublishForm] = useState(false);
  const [isLoadingRequestChangesForm, setIsLoadingRequestChangesForm] = useState(false);

  const isReviewMode = mode === "review" && true;

  const { data, isLoading, error } = useContentRead(contentId || '', {
    mode: 'edit',
  });
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

  // Stable event handlers to prevent player re-renders
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

  // Memoize player to prevent re-renders when dialog state changes
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

  const handlePublishClick = async () => {
    setIsLoadingPublishForm(true);
    try {
      const response = await formService.formRead({
        type: 'content',
        action: 'publish',
        subType: 'resource',
        rootOrgId: '*',
      });
      
      if (response.data?.form?.data?.fields) {
        setPublishFormFields(response.data.form.data.fields);
        setShowPublishDialog(true);
      } else {
        // Fallback: publish directly if no form data
        await handlePublishConfirm();
      }
    } catch (err) {
      console.error('Failed to load publish form:', err);
      toast({
        title: 'Error',
        description: 'Failed to load publish form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPublishForm(false);
    }
  };

  const handlePublishConfirm = async () => {
    if (!contentId) return;
    setIsPublishing(true);
    try {
      const userId = userAuthInfoService.getUserId() || '';
      await contentService.contentPublish(contentId, userId);
      toast({
        title: 'Published',
        description: 'Content has been published successfully.',
      });
      setShowPublishDialog(false);
      await queryClient.invalidateQueries({ queryKey: ['workspace-counts'] });
      await queryClient.invalidateQueries({ queryKey: ['workspace-own-counts'] });
      await queryClient.invalidateQueries({ queryKey: ['workspace-content'] });
      navigate('/workspace');
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to publish content.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRequestChangesClick = async () => {
    setIsLoadingRequestChangesForm(true);
    try {
      const response = await formService.formRead({
        type: 'content',
        action: 'requestforchanges',
        subType: 'resource',
        rootOrgId: '*',
      });
      
      if (response.data?.form?.data?.fields) {
        setRequestChangesFormFields(response.data.form.data.fields);
        setShowRequestChangesDialog(true);
      } else {
        // Fallback: show simple dialog if no form data
        toast({
          title: 'Error',
          description: 'Failed to load request changes form.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to load request changes form:', err);
      toast({
        title: 'Error',
        description: 'Failed to load request changes form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRequestChangesForm(false);
    }
  };

  const handleRequestChangesConfirm = async (rejectReasons: string[], rejectComment: string) => {
    if (!contentId) return;
    setIsRejecting(true);
    try {
      await contentService.contentReject(contentId, rejectReasons, rejectComment);
      toast({
        title: 'Changes Requested',
        description: 'Content has been sent back for changes.',
      });
      setShowRequestChangesDialog(false);
      await queryClient.invalidateQueries({ queryKey: ['workspace-counts'] });
      await queryClient.invalidateQueries({ queryKey: ['workspace-own-counts'] });
      await queryClient.invalidateQueries({ queryKey: ['workspace-content'] });
      navigate('/workspace');
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to request changes.',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (playerIsLoading) {
    return <PageLoader message="Loading content for review..." />;
  }

  if (playerError) {
    return (
      <div className="content-review-background">
        <Header />
        <main className="content-review-container">
          <p>Error loading content: {playerError.message}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!playerMetadata) {
    return (
      <div className="content-review-background">
        <Header />
        <main className="content-review-container">
          <p>Content not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="content-review-background">
      <Header />

      <main className="content-review-container">
        <div className="content-review-button-container">
          <button onClick={() => navigate('/workspace')} className="content-review-go-back">
            <FiArrowLeft />
            Back
          </button>
          {/* Action Buttons */}
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
        {/* Content Player */}
        {memoizedPlayer}

        {/* Content Details */}
        <div className="content-review-details-section">
          {contentData?.description && (
            <p className="content-review-description">
              {contentData?.description || 'No description provided.'}
            </p>
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
              <span className="value">
                {contentData?.primaryCategory || contentData?.contentType || 'N/A'}
              </span>
            </div>
            <div>
              <span className="label">Created On</span>
              <span className="value">{formatDate(contentData?.createdOn)}</span>
            </div>
          </div>
        </div>

        {/* Publish Dialog */}
        <ChecklistDialog
          isOpen={showPublishDialog}
          onClose={() => setShowPublishDialog(false)}
          onPublish={handlePublishConfirm}
          formFields={publishFormFields}
          isLoading={isPublishing}
          mode="publish"
        />

        {/* Request Changes Dialog */}
        <ChecklistDialog
          isOpen={showRequestChangesDialog}
          onClose={() => setShowRequestChangesDialog(false)}
          onRequestChanges={handleRequestChangesConfirm}
          formFields={requestChangesFormFields}
          isLoading={isRejecting}
          mode="request-changes"
        />
      </main>

      <Footer />
    </div>
  );
};

export default ContentReviewPage;
