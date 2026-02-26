import React, { useState, useEffect } from 'react';
import reviewCommentService from '@/services/ReviewCommentService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { UserService } from '@/services/UserService';
import './CommentSection.css';

interface Comment {
  comment: string;
  createdBy: string;
  createdOn: string;
  identifier: string;
}

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUser] = useState<{userName:string, userId: string}>();
  const userService = new UserService();

  useEffect(() => {
    loadComments();
    loadUserInfo();
  }, [contentId, contentVer, contentType, stageId]);

  const loadUserInfo = async () => {
    const userId = userAuthInfoService.getUserId();
    if (userId) {
      try {
        const response = await userService.userRead(userId);
        const first = response?.data?.response?.firstName?.trim();
        const last = response?.data?.response?.lastName?.trim();
        const userName = first || last ? [first, last].filter(Boolean).join(" ") : "anonymous";
        setUser({userName, userId});
      } catch (error) {
        console.error('Failed to load user info:', error);
        setUser({userName: "", userId:""});
      }
    }
  };

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const contextDetails = {
        contentId,
        contentVer,
        contentType,
        ...(stageId && { stageId })
      };

      const response = await reviewCommentService.readComments(contextDetails);

      if (response?.responseCode === 'OK') {
        const comments = response?.result?.comments || [];
        setComments(comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    if (!userData) {
      console.error('User data not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await reviewCommentService.createComment({
        contextDetails: {
          contentId,
          contentVer,
          contentType,
          ...(stageId && { stageId })
        },
        body: newComment.trim(),
        userId: userData.userId,
        userInfo: {
          name: userData.userName
        }
      });

      if (response?.responseCode === 'OK') {
        setNewComment('');
        await loadComments();
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="comment-section">
        <div className="comment-section-loading">Loading comments...</div>
      </div>
    );
  }

  // Don't render if no comments and not in review mode
  if (comments.length === 0 && !isReviewMode) {
    return null;
  }

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">Comments</h3>

      {comments.length > 0 && (
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
      )}

      {isReviewMode && (
        <div className="comment-input-section">
          <textarea
            className="comment-input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          <button
            className="comment-submit-btn"
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Add Comment'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
