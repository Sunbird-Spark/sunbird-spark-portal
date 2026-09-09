import type { HierarchyContentNode } from '../../../types/collectionTypes';

/**
 * Synthetic fixture: a Learning Path with a prior assessment (Level 0, one
 * question-set-only Course), two content Levels, a mid-level assessment
 * course, and an outcome assessment (last Level).
 */
export const LP_HIERARCHY_WITH_ASSESSMENTS: HierarchyContentNode = {
  identifier: 'do_lp_full',
  name: 'Data Foundations for Frontline Teams',
  primaryCategory: 'Learning Path',
  mimeType: 'application/vnd.ekstep.content-collection',
  objectType: 'Content',
  policy: 'Diagnostic',
  leafNodesCount: 6,
  children: [
    {
      identifier: 'level_prior',
      name: 'Prior gate',
      primaryCategory: 'Level',
      mimeType: 'application/vnd.ekstep.content-collection',
      objectType: 'Content',
      index: 0,
      children: [
        {
          identifier: 'course_prior',
          name: 'Data readiness check',
          primaryCategory: 'Course',
          mimeType: 'application/vnd.ekstep.content-collection',
          objectType: 'Content',
          index: 1,
          leafNodesCount: 1,
          se_skills: ['Data literacy', 'Spreadsheet basics', 'SQL basics'],
          children: [
            {
              identifier: 'qs_prior',
              name: 'Data readiness question set',
              primaryCategory: 'Question Set',
              mimeType: 'application/vnd.sunbird.questionset',
              objectType: 'QuestionSet',
              index: 1,
            },
          ],
        },
      ],
    },
    {
      identifier: 'level_1',
      name: 'Foundations',
      primaryCategory: 'Level',
      mimeType: 'application/vnd.ekstep.content-collection',
      objectType: 'Content',
      index: 1,
      competencies: ['Data literacy', 'Spreadsheet basics'],
      children: [
        {
          identifier: 'course_1a',
          name: 'Reading data honestly',
          primaryCategory: 'Course',
          mimeType: 'application/vnd.ekstep.content-collection',
          objectType: 'Content',
          index: 1,
          leafNodesCount: 1,
          se_skills: ['Data literacy'],
          children: [
            {
              identifier: 'res_1a',
              name: 'Lesson 1',
              primaryCategory: 'Resource',
              mimeType: 'application/pdf',
              objectType: 'Content',
              index: 1,
            },
          ],
        },
        {
          identifier: 'course_1_assess',
          name: 'Foundations check',
          primaryCategory: 'Course',
          mimeType: 'application/vnd.ekstep.content-collection',
          objectType: 'Content',
          index: 2,
          leafNodesCount: 1,
          se_skills: ['Data literacy', 'Spreadsheet basics'],
          children: [
            {
              identifier: 'qs_1',
              name: 'Foundations question set',
              primaryCategory: 'Question Set',
              mimeType: 'application/vnd.sunbird.questionset',
              objectType: 'QuestionSet',
              index: 1,
            },
          ],
        },
      ],
    },
    {
      identifier: 'level_outcome',
      name: 'Outcome gate',
      primaryCategory: 'Level',
      mimeType: 'application/vnd.ekstep.content-collection',
      objectType: 'Content',
      index: 2,
      children: [
        {
          identifier: 'course_outcome',
          name: 'Data Foundations outcome assessment',
          primaryCategory: 'Course',
          mimeType: 'application/vnd.ekstep.content-collection',
          objectType: 'Content',
          index: 1,
          leafNodesCount: 1,
          se_skills: ['Data literacy', 'Spreadsheet basics', 'SQL basics'],
          children: [
            {
              identifier: 'qs_outcome',
              name: 'Outcome question set',
              primaryCategory: 'Question Set',
              mimeType: 'application/vnd.sunbird.questionset',
              objectType: 'QuestionSet',
              index: 1,
            },
          ],
        },
      ],
    },
  ],
};

/** Empty Learning Path — created but no Levels linked yet. */
export const LP_HIERARCHY_EMPTY: HierarchyContentNode = {
  identifier: 'do_lp_empty',
  name: 'Untitled Learning Path',
  primaryCategory: 'Learning Path',
  mimeType: 'application/vnd.ekstep.content-collection',
  objectType: 'Content',
  leafNodesCount: 0,
  children: [],
};
