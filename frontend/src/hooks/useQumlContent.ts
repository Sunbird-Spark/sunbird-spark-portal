import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';

interface UseQumlContentOptions {
  enabled?: boolean;
}

/**
 * Hook for fetching and processing QUML content data
 * 
 * Handles the complex data fetching for QUML players:
 * - Fetches hierarchy and read data in parallel
 * - Collects question IDs from hierarchy
 * - Fetches full question data
 * - Merges questions with hierarchy
 * - Returns complete metadata for QumlPlayer
 */
export const useQumlContent = (
  questionSetId: string,
  options?: UseQumlContentOptions
): UseQueryResult<any, Error> => {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['quml', 'questionset', questionSetId],
    enabled: enabled && Boolean(questionSetId),
    queryFn: async () => {
      // Fetch hierarchy
      const hierarchyResp = await questionSetService.getHierarchy<any>(questionSetId);

      let metadata = hierarchyResp?.questionset;

      if (!metadata) {
        throw new Error('Hierarchy payload missing questionset');
      }

      // Collect all question IDs from hierarchy
      const collectQuestionIds = (node: any): string[] => {
        if (!node) return [];
        const ids: string[] = [];
        
        if (node.mimeType === 'application/vnd.sunbird.question' && node.identifier) {
          ids.push(node.identifier);
        }
        
        if (Array.isArray(node.children)) {
          node.children.forEach((child: any) => {
            ids.push(...collectQuestionIds(child));
          });
        }
        
        return ids;
      };

      const questionIds = collectQuestionIds(metadata);

      // Fetch full question data (with body, responseDeclaration, interactions, etc.)
      let questionMap = new Map<string, any>();
      if (questionIds.length > 0) {
        const listResp = await questionSetService.getQuestionList<any>(questionIds);
        const questions = listResp?.result?.questions || listResp?.questions || [];
        
        questions.forEach((q: any) => {
          if (q?.identifier) {
            questionMap.set(q.identifier, q);
          }
        });
      }

      // Replace question stubs in hierarchy with full question data
      const replaceQuestionsInHierarchy = (node: any): any => {
        if (!node) return node;

        if (node.mimeType === 'application/vnd.sunbird.question' && node.identifier) {
          return questionMap.get(node.identifier) || node;
        }

        if (Array.isArray(node.children)) {
          node.children = node.children.map(replaceQuestionsInHierarchy);
        }

        return node;
      };

      metadata = replaceQuestionsInHierarchy(metadata);

      // Ensure outcomeDeclaration.maxScore structure exists
      if (!metadata.outcomeDeclaration) {
        metadata.outcomeDeclaration = {};
      }
      if (!metadata.outcomeDeclaration.maxScore) {
        const maxScore = metadata.maxScore || 1;
        metadata.outcomeDeclaration.maxScore = {
          cardinality: 'single',
          type: 'integer',
          defaultValue: maxScore,
        };
      }

      return metadata;
    },
  });
};