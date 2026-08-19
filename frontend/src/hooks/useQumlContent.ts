import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';
import _ from 'lodash';

interface UseQumlContentOptions {
  enabled?: boolean;
}

/**
 * Resolve a node's max score using the SAME precedence as the player's own
 * normaliser (top-level `maxScore`, then `outcomeDeclaration.maxScore.defaultValue`,
 * then 1), so filling these in can never change the value it would have computed.
 */
function resolveMaxScore(node: any): number {
  const top = _.get(node, 'maxScore');
  if (top != null && Number.isFinite(Number(top)) && Number(top) > 0) return Number(top);
  const declared = _.get(node, 'outcomeDeclaration.maxScore.defaultValue');
  if (declared != null && Number.isFinite(Number(declared)) && Number(declared) > 0) {
    return Number(declared);
  }
  return 1;
}

/**
 * Write the resolved max score to both places it can be read from, so the two
 * never disagree.
 *
 * The player reads them inconsistently: its question normaliser prefers the
 * top-level `maxScore`, while the score-fraction normaliser prefers
 * `outcomeDeclaration.maxScore.defaultValue`. `question/v2/list` typically
 * returns only the latter, so mirroring keeps every code path in the player
 * agreeing on one number.
 */
function applyMaxScore(node: any): void {
  const maxScore = resolveMaxScore(node);
  if (!node.outcomeDeclaration) node.outcomeDeclaration = {};
  // Preserve any cardinality/type the content already declares; only the value
  // and its top-level mirror are ours to fill in.
  node.outcomeDeclaration.maxScore = {
    cardinality: 'single',
    type: 'integer',
    ...(node.outcomeDeclaration.maxScore ?? {}),
    defaultValue: maxScore,
  };
  node.maxScore = maxScore;
}

/**
 * Make a question's declared response type agree with the type of its own
 * interaction option values.
 *
 * This is what makes scoring work. The player scores multiple-choice and boolean
 * questions with a STRICT `===` between `responseDeclaration[key].correctResponse.value`
 * and the selected option's `value`, and it only coerces the correct response to a
 * number when the declaration says `type: 'integer'`. Sunbird content routinely
 * stores `correctResponse.value` as a string (`"0"`) while the interaction options
 * carry numeric values (`0`), so a missing or non-integer `type` leaves the
 * comparison as `0 === "0"` — permanently false. Every answer then scores 0, which
 * is exactly the "Best Score: 0/N even when correct" symptom.
 *
 * Declaring `integer` when the options are numeric lets the player's own
 * normaliser parse the correct response into the matching type. It is a no-op when
 * the declaration already says `integer` or when the options are not numeric.
 */
function alignResponseDeclarationTypes(node: any): void {
  const responseDeclaration = _.get(node, 'responseDeclaration');
  if (!responseDeclaration || typeof responseDeclaration !== 'object') return;
  const interactions = _.get(node, 'interactions') ?? {};

  Object.keys(responseDeclaration).forEach((key) => {
    const declaration = responseDeclaration[key];
    if (!declaration || typeof declaration !== 'object') return;
    if (String(declaration.type ?? '').toLowerCase() === 'integer') return;

    const options = _.get(interactions, [key, 'options']);
    if (!Array.isArray(options) || options.length === 0) return;
    const allNumeric = options.every((option: any) => typeof option?.value === 'number');
    if (!allNumeric) return;

    declaration.type = 'integer';
  });
}

export const useQumlContent = (
  questionSetId: string,
  options?: UseQumlContentOptions
): UseQueryResult<any, Error> => {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['quml', 'questionset', questionSetId],
    enabled: enabled && Boolean(questionSetId),
    // Matches useContentRead's staleTime (useContent.ts) - without it, any window-focus
    // event mid-attempt (e.g. tabbing away and back) refetches this hierarchy+question-list
    // and returns a new metadata object reference, which resets the QumlPlayer web component
    // to question 1 - indistinguishable from a page refresh from the learner's perspective,
    // and can happen right after a Submit if that action also causes a focus event.
    staleTime: 60 * 60 * 1000,
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
          const q = questionMap.get(node.identifier) || node;
          applyMaxScore(q);
          alignResponseDeclarationTypes(q);
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

      // Ensure outcomeDeclaration.maxScore (and its top-level mirror) exist
      applyMaxScore(metadata);

      return metadata;
    },
  });
};