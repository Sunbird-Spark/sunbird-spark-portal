import {
  FiBook,
  FiVideo,
  FiHelpCircle,
  FiGrid,
  FiList,
  FiEdit2,
  FiUpload,
  FiMap,
} from 'react-icons/fi';
import type { EditorCategory } from '../../types/workspaceTypes';

/** Option IDs that BOOK_CREATOR role is allowed to use */
export const BOOK_CREATOR_ALLOWED_OPTIONS = ['textbook'];

export function getEditorCategories(forBookCreator = false): EditorCategory[] {
  const collectionOptions = [
    {
      id: 'course',
      titleKey: 'workspace.editorOptions.course',
      descriptionKey: 'workspace.editorDescriptions.course',
      icon: FiBook,
      iconBg: 'bg-sunbird-wave/15',
      iconColor: 'text-sunbird-ink',
    },
    {
      id: 'learning-path',
      title: 'Learning Path',
      description: 'Guide learners through a structured sequence of courses and resources.',
      icon: FiMap,
      iconBg: 'bg-sunbird-wave/15',
      iconColor: 'text-sunbird-ink',
    }, ...(forBookCreator ? [{
      id: 'textbook',
      titleKey: 'workspace.editorOptions.textbook',
      descriptionKey: 'workspace.editorDescriptions.textbook',
      icon: FiBook,
      iconBg: 'bg-sunbird-wave/15',
      iconColor: 'text-sunbird-ink',
    }] : [{
      id: 'collection',
      titleKey: 'workspace.editorOptions.collection',
      descriptionKey: 'workspace.editorDescriptions.collection',
      icon: FiGrid,
      iconBg: 'bg-sunbird-wave/15',
      iconColor: 'text-sunbird-ink',
    }])
  ];

  return [
    {
      id: 'collection-editor',
      titleKey: 'workspace.categories.collectionEditor.title',
      subtitleKey: 'workspace.categories.collectionEditor.subtitle',
      accentColor: 'bg-sunbird-wave',
      borderColor: 'border-sunbird-wave/30',
      headerStyle: { background: 'var(--category-gradient-1)' },
      options: collectionOptions,
    },
    {
      id: 'upload-editor',
      titleKey: 'workspace.categories.uploadEditor.title',
      subtitleKey: 'workspace.categories.uploadEditor.subtitle',
      accentColor: 'bg-sunbird-theme-accent-muted',
      borderColor: 'border-sunbird-theme-accent-muted/30',
      headerStyle: { background: 'var(--category-gradient-2)' },
      options: [
        {
          id: 'upload-content',
          titleKey: 'workspace.editorOptions.uploadContent',
          descriptionKey: 'workspace.editorDescriptions.uploadContent',
          icon: FiUpload,
          iconBg: 'bg-sunbird-theme-accent-muted/15',
          iconColor: 'text-sunbird-theme-accent',
        },
        {
          id: 'upload-large-content',
          titleKey: 'workspace.editorOptions.uploadLargeContent',
          descriptionKey: 'workspace.editorDescriptions.uploadLargeContent',
          icon: FiVideo,
          iconBg: 'bg-sunbird-theme-accent-muted/15',
          iconColor: 'text-sunbird-theme-accent',
        },
      ],
    },
    {
      id: 'resource-editor',
      titleKey: 'workspace.categories.resourceEditor.title',
      subtitleKey: 'workspace.categories.resourceEditor.subtitle',
      accentColor: 'bg-sunbird-moss',
      borderColor: 'border-sunbird-moss/30',
      headerStyle: { background: 'var(--category-gradient-3)' },
      options: [
        {
          id: 'quiz',
          titleKey: 'workspace.editorOptions.quiz',
          descriptionKey: 'workspace.editorDescriptions.quiz',
          icon: FiHelpCircle,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
        {
          id: 'story',
          titleKey: 'workspace.editorOptions.story',
          descriptionKey: 'workspace.editorDescriptions.story',
          icon: FiUpload,
          iconBg: 'bg-sunbird-moss/15',
          iconColor: 'text-sunbird-forest',
        },
      ],
    },
    {
      id: 'quml-editor',
      titleKey: 'workspace.categories.qumlEditor.title',
      subtitleKey: 'workspace.categories.qumlEditor.subtitle',
      accentColor: 'bg-sunbird-lavender',
      borderColor: 'border-sunbird-lavender/30',
      headerStyle: { background: 'var(--category-gradient-4)' },
      options: [
        {
          id: 'question-set',
          titleKey: 'workspace.editorOptions.questionSet',
          descriptionKey: 'workspace.editorDescriptions.questionSet',
          icon: FiList,
          iconBg: 'bg-sunbird-lavender/15',
          iconColor: 'text-sunbird-jamun',
        },
        {
          id: 'question-editor',
          titleKey: 'workspace.editorOptions.questionEditor',
          descriptionKey: 'workspace.editorDescriptions.questionEditor',
          icon: FiEdit2,
          iconBg: 'bg-sunbird-lavender/15',
          iconColor: 'text-sunbird-jamun',
        },
      ],
    },
  ];
}
