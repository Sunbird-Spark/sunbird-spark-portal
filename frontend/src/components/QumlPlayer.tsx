import React, { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';
import { buildPlayerConfig, PlayerConfig } from '../utils/buildPlayerConfig';
import styles from './QumlPlayer.module.css';

type QumlPlayerProps = {
  questionSetId?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const QUESTION_LIST_URL =
  import.meta.env.VITE_QUESTION_LIST_URL ||
  `${API_BASE.replace(/\/$/, '')}/action/question/v2/list`;

// Expose question list URL early for the web component
(window as any).questionListUrl = QUESTION_LIST_URL;
let stylesLoaded = false;

/**
 * Load QUML player styles dynamically (only once)
 * Prevents unnecessary CSS loading if no QUML player is used on the page
 */
const loadQumlPlayerStyles = (): void => {
  // Check if styles already exist in the DOM (prevents race conditions)
  const existingStyles = document.querySelector('[data-quml-player-styles="true"]');
  if (existingStyles || stylesLoaded) {
    stylesLoaded = true;
    return;
  }

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = '/assets/quml-player/styles.css';
  styleLink.setAttribute('data-quml-player-styles', 'true');
  document.head.appendChild(styleLink);
  stylesLoaded = true;
};

const QumlPlayer: React.FC<QumlPlayerProps> = ({ questionSetId }) => {
  const { questionSetId: routeQuestionSetId } = useParams<{ questionSetId?: string }>();
  const playerRef = useRef<HTMLElement>(null);

  const qsId = useMemo(
    () => routeQuestionSetId || questionSetId || '',
    [questionSetId, routeQuestionSetId],
  );

  const questionSetQuery = useQuery({
    queryKey: ['quml', 'questionset', qsId],
    enabled: Boolean(qsId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Fetch hierarchy and read in parallel (like old portal's forkJoin)
      const [hierarchyResp, readResp] = await Promise.all([
        questionSetService.getHierarchy<any>(qsId),
        questionSetService.getRead<any>(qsId),
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

      return { metadata };
    },
  });

  const playerConfig = useMemo<PlayerConfig | null>(() => {
    if (!questionSetQuery.data) return null;
    const channel = questionSetQuery.data.metadata?.channel;
    const uid = questionSetQuery.data.metadata?.createdBy || 'anonymous';

    return buildPlayerConfig({
      metadata: questionSetQuery.data.metadata,
      orgChannel: channel,
      deviceId: '',
      appId: import.meta.env.VITE_APP_ID,
      pid: import.meta.env.VITE_PID,
      buildNumber: import.meta.env.VITE_BUILD_NUMBER,
      uid,
      host: window.location.origin,
      env: 'contentplayer',
      endpoint: '/data/v3/telemetry',
      enableTelemetryValidation: false,
    });
  }, [questionSetQuery.data]);

  useEffect(() => {
    if (!playerRef.current || !playerConfig) return;

    // Load QUML player styles when player is first initialized
    loadQumlPlayerStyles();

    playerRef.current.setAttribute('player-config', JSON.stringify(playerConfig));
  }, [playerConfig]);

  if (!questionSetQuery.data || !playerConfig) {
    return <div>No question set data available</div>;
  }

  return (
    <div className={styles.qumlPlayerContainer}>
      <sunbird-quml-player ref={playerRef} />
    </div>
  );
};

export default QumlPlayer;
