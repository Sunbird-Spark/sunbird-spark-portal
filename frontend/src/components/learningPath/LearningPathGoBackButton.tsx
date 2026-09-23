import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useLearningPathBackNavigation } from '@/pages/learningPath/useLearningPathBackNavigation';

/** Mirrors `CollectionGoBackButton` for the Learning Path overview screen. */
export const LearningPathGoBackButton: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppI18n();
  const backTo = useLearningPathBackNavigation();

  return (
    <button
      onClick={() => navigate(backTo)}
      className="flex items-center gap-2 text-sunbird-theme-accent text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
      data-edataid="learning-path-go-back"
      data-pageid="learning-path-detail"
    >
      <FiArrowLeft className="w-4 h-4" />
      {t('button.goBack')}
    </button>
  );
};
