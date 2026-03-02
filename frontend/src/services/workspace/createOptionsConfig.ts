import {
  FiBook,
  FiVideo,
  FiHelpCircle,
  FiGrid,
  FiList,
  FiEdit2,
  FiUpload,
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
      headerStyle: { background: 'var(--category-gradient-1)' },
      options: [
        {
          id: 'course',
          title: 'Course',
          description: 'Design courses with modules, lessons, and assessments.',
          icon: FiBook,
          iconBg: 'bg-sunbird-wave/15',
          iconColor: 'text-sunbird-ink',
        },
        {
          id: 'collection',
          title: 'Collection',
          description: 'Organize and curate resources into thematic collections.',
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
      headerStyle: { background: 'var(--category-gradient-2)' },
      options: [
        {
          id: 'upload-content',
          title: 'Upload Content',
          description: 'Upload PDFs, videos, presentations, and documents for learners.',
          icon: FiUpload,
          iconBg: 'bg-sunbird-ginger/15',
          iconColor: 'text-sunbird-brick',
        },
        {
          id: 'upload-large-content',
          title: 'Upload Large Content',
          description: 'Upload large video files from your local device (MP4, etc.)',
          icon: FiVideo,
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
      headerStyle: { background: 'var(--category-gradient-3)' },
      options: [
        {
          id: 'quiz',
          title: 'Quiz & Assessment',
          description: 'Create quizzes with MCQs, fill-in-the-blanks, and auto-grading.',
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
    {
      id: 'quml-editor',
      title: 'QuML Editor',
      subtitle: 'Create and manage assessments',
      accentColor: 'bg-sunbird-lavender',
      borderColor: 'border-sunbird-lavender/30',
      headerStyle: { background: 'var(--category-gradient-4)' },
      options: [
        {
          id: 'question-set',
          title: 'Question Set',
          description: 'Create and manage sets of questions for quizzes and assessments.',
          icon: FiList,
          iconBg: 'bg-sunbird-lavender/15',
          iconColor: 'text-sunbird-jamun',
        },
        {
          id: 'question-editor',
          title: 'Question Editor',
          description: 'Create, edit, and manage individual questions.',
          icon: FiEdit2,
          iconBg: 'bg-sunbird-lavender/15',
          iconColor: 'text-sunbird-jamun',
        },
      ],
    },
  ];
}
