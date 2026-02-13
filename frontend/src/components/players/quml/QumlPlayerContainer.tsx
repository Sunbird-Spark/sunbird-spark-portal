import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionSetService } from '../../../services/QuestionSetService';
import QumlPlayer from './QumlPlayer';
import type { QumlPlayerEvent } from '../../../services/players/quml/types';

interface QumlPlayerContainerProps {
  /** Question set ID (optional - can be from route params) */
  questionSetId?: string;
  /** Player mode */
  mode?: string;
  /** Correlation data for telemetry */
  cdata?: any[];
  /** Context rollup */
  contextRollup?: { l1: string };
  /** Object rollup */
  objectRollup?: Record<string, any>;
  /** Player event handler */
  onPlayerEvent?: (event: QumlPlayerEvent) => void;
  /** Telemetry event handler */
  onTelemetryEvent?: (event: any) => void;
}

/**
 * QumlPlayer Container Component
 * 
 * Handles data fetching for the QUML player:
 * - Fetches hierarchy and read data in parallel
 * - Collects question IDs from hierarchy
 * - Fetches full question data
 * - Merges questions with hierarchy
 * - Passes complete metadata to QumlPlayer
 * 
 * This component separates data fetching from presentation,
 * following the same pattern as EpubPlayer.
 */
const QumlPlayerContainer: React.FC<QumlPlayerContainerProps> = ({
  questionSetId,
  mode,
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const { questionSetId: routeQuestionSetId } = useParams<{ questionSetId?: string }>();

  const qsId = useMemo(
    () => routeQuestionSetId || questionSetId || '',
    [questionSetId, routeQuestionSetId]
  );

  const questionSetQuery = useQuery({
    queryKey: ['quml', 'questionset', qsId],
    enabled: Boolean(qsId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Fetch hierarchy and read in parallel (like old portal's forkJoin)
      const [hierarchyResp, readResp] = await Promise.all([
        questionSetService.getHierarchy<any>(qsId),
        questionSetService.getQuestionset<any>(qsId),
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

  if (questionSetQuery.isLoading) {
    return <div>Loading question set...</div>;
  }

  if (questionSetQuery.isError) {
    return <div>Error loading question set: {(questionSetQuery.error as Error)?.message}</div>;
  }

  if (!questionSetQuery.data) {
    return <div>No question set data available</div>;
  }

  return (
    <QumlPlayer
      metadata={questionSetQuery.data}
      mode={mode}
      cdata={cdata}
      contextRollup={contextRollup}
      objectRollup={objectRollup}
      onPlayerEvent={onPlayerEvent}
      onTelemetryEvent={onTelemetryEvent}
    />
  );
};

export default QumlPlayerContainer;
