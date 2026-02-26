import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import reviewCommentService, {
  type ContextDetails,
  type CreateCommentRequest,
} from '@/services/ReviewCommentService';

interface UseReviewCommentOptions {
  contentId: string;
  contentVer: string;
  contentType: string;
  stageId?: string;
  enabled?: boolean;
}

/**
 * Custom hook for managing review comments with React Query
 * Provides create, read, and delete operations for review comments
 */
export const useReviewComment = (options: UseReviewCommentOptions) => {
  const { contentId, contentVer, contentType, stageId, enabled = true } = options;
  const queryClient = useQueryClient();

  // Query key for caching
  const queryKey = ['reviewComments', contentId, contentVer, contentType, stageId];

  /**
   * Fetch comments query
   */
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const contextDetails: ContextDetails = {
        contentId,
        contentVer,
        contentType,
        ...(stageId && { stageId }),
      };
      const response = await reviewCommentService.readComments(contextDetails);
      return response.comments || [];
    },
    enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  /**
   * Create comment mutation
   */
  const createCommentMutation = useMutation({
    mutationFn: async (request: CreateCommentRequest) => {
      return await reviewCommentService.createComment(request);
    },
    onSuccess: () => {
      // Invalidate and refetch comments after successful creation
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Delete comments mutation
   */
  const deleteCommentsMutation = useMutation({
    mutationFn: async (contextDetails: ContextDetails) => {
      return await reviewCommentService.deleteComments(contextDetails);
    },
    onSuccess: () => {
      // Invalidate and refetch comments after successful deletion
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /**
   * Helper function to create a comment
   */
  const createComment = async (body: string, userId: string, userInfo: { name: string; logo?: string }) => {
    const request: CreateCommentRequest = {
      contextDetails: {
        contentId,
        contentVer,
        contentType,
        ...(stageId && { stageId }),
      },
      body,
      userId,
      userInfo,
    };
    return createCommentMutation.mutateAsync(request);
  };

  /**
   * Helper function to delete all comments for the current context
   */
  const deleteComments = async () => {
    const contextDetails: ContextDetails = {
      contentId,
      contentVer,
      contentType,
      ...(stageId && { stageId }),
    };
    return deleteCommentsMutation.mutateAsync(contextDetails);
  };

  return {
    // Comments data
    comments: commentsData || [],
    isLoadingComments,
    commentsError,
    refetchComments,

    // Create comment
    createComment,
    isCreatingComment: createCommentMutation.isPending,
    createCommentError: createCommentMutation.error,

    // Delete comments
    deleteComments,
    isDeletingComments: deleteCommentsMutation.isPending,
    deleteCommentsError: deleteCommentsMutation.error,
  };
};
