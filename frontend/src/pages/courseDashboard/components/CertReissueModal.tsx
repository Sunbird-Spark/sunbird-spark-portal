import React from 'react';
import { Button } from '@/components/common/Button';
import { useAppI18n } from '@/hooks/useAppI18n';

interface ReissueTarget {
  userId: string;
  userName: string;
  batchId: string;
  batchName: string;
}

interface CertReissueModalProps {
  reissueTarget: ReissueTarget | null;
  reissuing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CertReissueModal: React.FC<CertReissueModalProps> = ({
  reissueTarget,
  reissuing,
  onClose,
  onConfirm,
}) => {
  const { t } = useAppI18n();

  if (!reissueTarget) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]" data-testid="reissue-modal">
      <div className="bg-card rounded-xl p-8 w-full max-w-md shadow-lg mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">{t('certificate.reissueCertificate')}</h3>
        <p className="text-sm text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: t('certificate.reissueConfirmation', { userName: reissueTarget.userName, batchName: reissueTarget.batchName }) }} />
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            className="font-rubik"
            onClick={onClose}
            data-testid="modal-no-btn"
            disabled={reissuing}
          >
            {t('certificatesTab.no')}
          </Button>
          <Button
            className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-rubik transition-colors"
            onClick={onConfirm}
            data-testid="modal-yes-btn"
            data-edataid="certificate-reissue-confirm"
            data-pageid="course-dashboard-certificates"
            disabled={reissuing}
          >
            {reissuing ? t('certificate.reissuing') : t('certificatesTab.yes')}
          </Button>
        </div>
      </div>
    </div>
  );
};
