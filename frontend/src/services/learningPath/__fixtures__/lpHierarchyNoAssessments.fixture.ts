import type { HierarchyContentNode } from '../../../types/collectionTypes';

/**
 * Trimmed but structurally faithful fixture of the real
 * `GET /course/v1/hierarchy/do_2146317230884208641312` response (`result.content`):
 * a Learning Path with two Levels, each wrapping one Course with one Course
 * Unit and one leaf Resource. No prior/outcome assessment is linked — this is
 * the common case the mapper must handle gracefully.
 */
export const LP_HIERARCHY_NO_ASSESSMENTS: HierarchyContentNode = {
  identifier: 'do_2146317230884208641312',
  name: 'TLP-1',
  description: 'Enter description for Learning Path',
  primaryCategory: 'Learning Path',
  contentType: 'Course',
  mimeType: 'application/vnd.ekstep.content-collection',
  objectType: 'Content',
  policy: 'Fixed',
  leafNodesCount: 3,
  children: [
    {
      identifier: 'do_2146317426971115521341',
      name: 'Level-1',
      description: '',
      primaryCategory: 'Level',
      contentType: 'Level',
      mimeType: 'application/vnd.ekstep.content-collection',
      objectType: 'Content',
      index: 1,
      leafNodesCount: 2,
      children: [
        {
          identifier: 'do_2146316303263006721126',
          name: 'LP-Course-1-JP-PP',
          description: 'Course with skills Java Prog and Python Prog',
          primaryCategory: 'Course',
          contentType: 'Course',
          mimeType: 'application/vnd.ekstep.content-collection',
          objectType: 'Content',
          index: 1,
          leafNodesCount: 2,
          se_skills: ['Python Programming', 'Java Programming'],
          children: [
            {
              identifier: 'do_2146316306604032001129',
              name: 'Unit-1',
              primaryCategory: 'Course Unit',
              contentType: 'CourseUnit',
              mimeType: 'application/vnd.ekstep.content-collection',
              objectType: 'Content',
              index: 1,
              leafNodesCount: 1,
              children: [
                {
                  identifier: 'do_21463158442296934411',
                  name: 'LP-Content-1-JavaProg',
                  primaryCategory: 'Explanation Content',
                  contentType: 'Resource',
                  mimeType: 'application/pdf',
                  objectType: 'Content',
                  index: 1,
                  se_skills: ['Java Programming'],
                },
              ],
            },
            {
              identifier: 'do_2146316306604113921131',
              name: 'Unit-2',
              primaryCategory: 'Course Unit',
              contentType: 'CourseUnit',
              mimeType: 'application/vnd.ekstep.content-collection',
              objectType: 'Content',
              index: 2,
              leafNodesCount: 1,
              children: [
                {
                  identifier: 'do_214631592231313408130',
                  name: 'LP-Content-2-Epub-PythProg',
                  primaryCategory: 'Teacher Resource',
                  contentType: 'Resource',
                  mimeType: 'application/epub',
                  objectType: 'Content',
                  index: 1,
                  se_skills: ['Python Programming'],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      identifier: 'do_2146317426971197441343',
      name: 'Level-2',
      description: '',
      primaryCategory: 'Level',
      contentType: 'Level',
      mimeType: 'application/vnd.ekstep.content-collection',
      objectType: 'Content',
      index: 2,
      leafNodesCount: 1,
      children: [
        {
          identifier: 'do_214631618315042816133',
          name: 'LP-Course-2-JS',
          description: 'Course with skills Java Script',
          primaryCategory: 'Course',
          contentType: 'Course',
          mimeType: 'application/vnd.ekstep.content-collection',
          objectType: 'Content',
          index: 1,
          leafNodesCount: 1,
          se_skills: ['JavaScript'],
          children: [
            {
              identifier: 'do_214631618657075200136',
              name: 'Unit-1',
              primaryCategory: 'Course Unit',
              contentType: 'CourseUnit',
              mimeType: 'application/vnd.ekstep.content-collection',
              objectType: 'Content',
              index: 1,
              leafNodesCount: 1,
              children: [
                {
                  identifier: 'do_214631615408873472110',
                  name: 'LP-Content-3-Video-JavaScr',
                  primaryCategory: 'Learning Resource',
                  contentType: 'Resource',
                  mimeType: 'video/mp4',
                  objectType: 'Content',
                  index: 1,
                  se_skills: ['JavaScript'],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
