import { FiAward } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import { Button } from '@/components/ui/button';

interface CertificateLockCardProps {
  levelCount: number;
  doneLevels: number;
  unlocked: boolean;
  onDownload?: () => void;
}

/** Dashed-border certificate card — locked until the outcome assessment closes the path. */
export function CertificateLockCard({ levelCount, doneLevels, unlocked, onDownload }: CertificateLockCardProps) {
  const { t } = useAppI18n();

  return (
    <div className="rounded-xl border border-dashed border-sunbird-gray-b2 bg-surface p-5" data-testid="certificate-lock-card">
      <div className="mb-2.5 flex items-center gap-2.5">
        <FiAward className="h-[1.0625rem] w-[1.0625rem] text-sunbird-gray-77" />
        <span className="text-sm font-medium text-foreground">{t('learningPath.certificate')}</span>
      </div>
      <p className="mb-3.5 text-sm leading-relaxed text-sunbird-gray-4a">
        {t('learningPath.certificateUnlockNote', { levelCount, doneLevels })}
      </p>
      <Button variant="outline" size="sm" className="w-full" disabled={!unlocked} onClick={onDownload}>
        {unlocked ? t('learningPath.download') : t('learningPath.locked')}
      </Button>
    </div>
  );
}
