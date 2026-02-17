import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';
import _ from 'lodash';

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

      let metadata = _.get(hierarchyResp, 'questionset');

      if (!metadata) {
        throw new Error(`Hierarchy payload missing questionset for ID: ${questionSetId}`);
      }

      // Collect all question IDs from hierarchy
      const collectQuestionIds = (node: any): string[] => {
        if (!node) return [];
        
        const currentId = 
          node.mimeType === 'application/vnd.sunbird.question' && node.identifier
            ? [node.identifier]
            : [];
        
        const childIds = _.flatMap(_.get(node, 'children', []), collectQuestionIds);
        
        return [...currentId, ...childIds];
      };

      const questionIds = collectQuestionIds(metadata);

      // Fetch full question data (with body, responseDeclaration, interactions, etc.)
      let questionMap = new Map<string, any>();
      if (!_.isEmpty(questionIds)) {
        const listResp = await questionSetService.getQuestionList<any>(questionIds);
        const questions = _.get(listResp, 'result.questions') || _.get(listResp, 'questions', []);
        
        questions.forEach((q: any) => {
          const identifier = _.get(q, 'identifier');
          if (identifier) {
            questionMap.set(identifier, q);
          }
        });
      }

      // Replace question stubs in hierarchy with full question data
      const replaceQuestionsInHierarchy = (node: any): any => {
        if (!node) return node;

        if (node.mimeType === 'application/vnd.sunbird.question' && node.identifier) {
          return questionMap.get(node.identifier) || node;
        }

        const children = _.get(node, 'children');
        if (Array.isArray(children)) {
          // Children are replaced to include full question attributes
          // (outcomeDeclaration, body, responseDeclaration etc.) from the list API response
          node.children = _.map(children, replaceQuestionsInHierarchy);
        }

        return node;
      };

      metadata = replaceQuestionsInHierarchy(metadata);

      // Ensure outcomeDeclaration.maxScore structure exists
      if (!_.get(metadata, 'outcomeDeclaration')) {
        metadata.outcomeDeclaration = {};
      }
      if (!_.get(metadata, 'outcomeDeclaration.maxScore')) {
        const maxScore = _.get(metadata, 'maxScore', 1);
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