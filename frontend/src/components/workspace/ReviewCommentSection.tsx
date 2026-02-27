import React, { useState, useEffect } from 'react';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { UserService } from '@/services/UserService';
import { useReviewComment } from '@/hooks/useReviewComment';
import { useAppI18n } from '@/hooks/useAppI18n';
import './ReviewCommentSection.css';

interface CommentSectionProps {
  contentId: string;
  contentVer?: string;
  contentType?: string;
  stageId?: string;
  isReviewMode?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  contentId,
  contentVer = '0',
  contentType = 'application/vnd.ekstep.ecml-archive',
  stageId,
  isReviewMode = false
}) => {
  const { t } = useAppI18n();
  const [newComment, setNewComment] = useState('');
  const [userData, setUser] = useState<{userName:string, userId: string}>();
  const userService = new UserService();

  // Use the review comment hook
  const {
    comments,
    isLoadingComments,
    commentsError,
    createComment,
    isCreatingComment,
  } = useReviewComment({
    contentId,
    contentVer,
    contentType,
    stageId,
    enabled: true,
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const userId = userAuthInfoService.getUserId();
    if (userId) {
      try {
        const response = await userService.userRead(userId);
        const first = response?.data?.response?.firstName?.trim();
        const last = response?.data?.response?.lastName?.trim();
        const userName = first || last ? [first, last].filter(Boolean).join(" ") : t('workspace.review.anonymous');
        setUser({userName, userId});
      } catch (error) {
        console.error('Failed to load user info:', error);
        setUser({userName: "", userId:""});
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    if (!userData) {
      console.error('User data not found');
      return;
    }

    try {
      await createComment(newComment.trim(), userData.userId, {
        name: userData.userName
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingComments) {
    return (
      <div className="comment-section">
        <div className="comment-section-loading">{t('workspace.review.loadingComments')}</div>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">{t('workspace.review.comments')}</h3>

      {comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.identifier} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.createdBy}</span>
                <span className="comment-date">{formatDate(comment.createdOn)}</span>
              </div>
              <p className="comment-text">{comment.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-comments-message">{t(isReviewMode ? 'workspace.review.noCommentsYet' : 'workspace.review.noCommentsYetViewMode')}</p>
      )}

      {isReviewMode && (
        <div className="comment-input-section">
          <textarea
            className="comment-input"
            placeholder={t('workspace.review.addCommentPlaceholder')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={isCreatingComment}
          />
          <button
            className="comment-submit-btn"
            onClick={handleSubmitComment}
            disabled={isCreatingComment || !newComment.trim()}
          >
            {isCreatingComment ? t('checklistDialog.submitting') : t('workspace.review.addComment')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
