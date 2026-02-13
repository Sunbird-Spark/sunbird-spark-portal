import {
  FiBook,
  FiFileText,
  FiUpload,
  FiVideo,
  FiYoutube,
  FiActivity,
  FiLayers,
  FiHelpCircle,
  FiGrid,
} from 'react-icons/fi';
import type { EditorCategory } from '../../types/workspaceTypes';

export function getEditorCategories(): EditorCategory[] {
  return [
    {
      id: 'collection-editor',
      title: 'Collection Editor',
      subtitle: 'Create structured learning content',
      accentColor: 'bg-sunbird-wave',
      borderColor: 'border-sunbird-wave/30',
      options: [
        {
          id: 'course',
          title: 'Course',
          description: 'Design courses with modules, lessons, and assessments for structured learning paths.',
          icon: FiBook,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
        {
          id: 'textbook',
          title: 'Textbook',
          description: 'Create digital textbooks with chapters, sections, and rich multimedia content.',
          icon: FiLayers,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
        {
          id: 'collection',
          title: 'Collection',
          description: 'Organize and curate resources into thematic collections for easy discovery.',
          icon: FiGrid,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
      ],
    },
    {
      id: 'upload-editor',
      title: 'Upload Editor',
      subtitle: 'Upload and publish existing content',
      accentColor: 'bg-sunbird-ginger',
      borderColor: 'border-sunbird-ginger/30',
      options: [
        {
          id: 'upload-pdf',
          title: 'PDF Document',
          description: 'Upload PDF files, presentations, and documents for learner access.',
          icon: FiFileText,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
        {
          id: 'upload-video',
          title: 'Video Content',
          description: 'Upload video files with automatic transcoding and streaming optimization.',
          icon: FiVideo,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
        {
          id: 'upload-youtube',
          title: 'YouTube Video',
          description: 'Link YouTube videos with embedded player and tracking capabilities.',
          icon: FiYoutube,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
      ],
    },
    {
      id: 'resource-editor',
      title: 'Resource Editor',
      subtitle: 'Create interactive learning resources',
      accentColor: 'bg-sunbird-moss',
      borderColor: 'border-sunbird-moss/30',
      options: [
        {
          id: 'interactive',
          title: 'Interactive Activity',
          description: 'Build engaging activities with drag-drop, matching, and simulation elements.',
          icon: FiActivity,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
        {
          id: 'quiz',
          title: 'Quiz & Assessment',
          description: 'Create quizzes with MCQs, fill-in-the-blanks, and auto-grading capabilities.',
          icon: FiHelpCircle,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
        {
          id: 'story',
          title: 'Story & Game',
          description: 'Design interactive stories and gamified learning experiences.',
          icon: FiUpload,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
      ],
    },
  ];
}
