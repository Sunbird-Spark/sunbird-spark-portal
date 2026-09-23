import { useNavigate } from 'react-router-dom';
import { FiLayout } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from '@/components/common/Button';
import BatchCard from '@/components/collection/BatchCard';

interface LearningPathCreatorPanelProps {
  pathId: string;
  pathName?: string;
}

/**
 * Creator/mentor rail for the Learning Path overview — mirrors the "View Course Dashboard" button
 * + <BatchCard> shown on CollectionSidePanel.tsx, so an LP creator gets the same batch/certificate
 * management surface a course creator has. Rendered instead of EnrolCard when the viewer owns the
 * path or mentors one of its batches.
 */
export function LearningPathCreatorPanel({ pathId, pathName }: LearningPathCreatorPanelProps) {
  const navigate = useNavigate();
  const { t } = useAppI18n();

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 font-rubik text-sunbird-theme-accent border-sunbird-theme-accent hover:bg-sunbird-theme-accent/5 bg-white shadow-sm"
        onClick={() => navigate(`/learning-path/${pathId}/dashboard/batches`)}
        data-testid="view-path-dashboard-btn"
      >
        <FiLayout className="w-4 h-4" />
        {t('learningPath.viewPathDashboard')}
      </Button>
      <BatchCard collectionId={pathId} collectionName={pathName} title={t('learningPath.manageBatches')} />
    </div>
  );
}
