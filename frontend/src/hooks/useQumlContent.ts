import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';
import _ from 'lodash';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { dynamicAssessForLearner, scoreOf } from '@/services/players/dynamicAssessSubset';

/** knowlg-service rejects question/list requests with more identifiers than this (question.list.limit). */
const QUESTION_LIST_LIMIT = 20;

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
  const learnerId = userAuthInfoService.getUserId();

  return useQuery({
    queryKey: ['quml', 'questionset', questionSetId, learnerId],
    enabled: enabled && Boolean(questionSetId),
    queryFn: async () => {
      // Fetch hierarchy
      const hierarchyResp = await questionSetService.getHierarchy<any>(questionSetId);

      let metadata = _.get(hierarchyResp, 'questionset');

      if (!metadata) {
        throw new Error(`Hierarchy payload missing questionset for ID: ${questionSetId}`);
      }

      // Dynamic Assess: draw the learner's questions before fetching, so question/list (capped at 20 ids) only returns the drawn questions' content.
      metadata = dynamicAssessForLearner(metadata, learnerId);

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
        // question/list accepts at most 20 ids per request, so a Dynamic learner set larger than that is fetched in batches; other sets keep the single request.
        const batches = metadata?.primaryCategory === 'Dynamic QuestionSet' ? _.chunk(questionIds, QUESTION_LIST_LIMIT) : [questionIds];
        const responses = await Promise.all(batches.map((ids) => questionSetService.getQuestionList<any>(ids)));
        const questions = responses.flatMap((listResp) => _.get(listResp, 'result.questions') || _.get(listResp, 'questions', []));

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
          const q = questionMap.get(node.identifier) || node;
          if (!_.get(q, 'outcomeDeclaration.maxScore')) {
            if (!q.outcomeDeclaration) q.outcomeDeclaration = {};
            q.outcomeDeclaration.maxScore = {
              cardinality: 'single',
              type: 'integer',
              defaultValue: _.get(q, 'maxScore', 1),
            };
          }
          return q;
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

      // Dynamic Assess: the draw scored the hierarchy stubs, which may lack marks, so total the hydrated questions instead.
      if (metadata?.primaryCategory === 'Dynamic QuestionSet' && Array.isArray(metadata.children)) {
        const maxScore = metadata.children.reduce((sum: number, q: any) => sum + scoreOf(q), 0);
        metadata.maxScore = maxScore;
        metadata.outcomeDeclaration = {
          ...(metadata.outcomeDeclaration ?? {}),
          maxScore: { cardinality: 'single', type: 'integer', ...(metadata.outcomeDeclaration?.maxScore ?? {}), defaultValue: maxScore },
        };
      }

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