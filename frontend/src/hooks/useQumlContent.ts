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
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      // Fetch hierarchy and read in parallel (like old portal's forkJoin)
      const [hierarchyResp, readResp] = await Promise.all([
        questionSetService.getHierarchy<any>(questionSetId),
        questionSetService.getQuestionset<any>(questionSetId),
      ]);

      let metadata =
        hierarchyResp?.result?.questionset ||
        hierarchyResp?.result?.questionSet ||
        hierarchyResp?.questionset ||
        hierarchyResp;

      if (!metadata) {
        throw new Error('Hierarchy payload missing questionset');
      }

      // Merge additional properties from read API (instructions, maxScore, etc.)
      const readData = readResp?.result?.questionset || readResp?.result?.questionSet;
      if (readData) {
        if (readData.instructions) {
          metadata.instructions = readData.instructions;
        }
        if (readData.maxScore) {
          metadata.maxScore = readData.maxScore;
        }
        if (readData.outcomeDeclaration) {
          metadata.outcomeDeclaration = readData.outcomeDeclaration;
        }
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
          const fullQuestion = questionMap.get(node.identifier);
          if (fullQuestion) {
            return {
              ...fullQuestion,
              parent: node.parent,
              index: node.index,
              depth: node.depth,
              graphId: node.graphId,
            };
          }
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