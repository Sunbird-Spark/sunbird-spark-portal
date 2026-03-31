import React, { useState } from 'react';
import { useCertUserSearch, useReissueCert } from '@/hooks/useCourseDashboard';
import { useBatchListForMentor } from '@/hooks/useBatch';
import { useIsContentCreator, useIsMentor } from '@/hooks/useUser';
import type { CertUserBatch } from '@/services/CertificateTypes';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useAppI18n } from '@/hooks/useAppI18n';
import { CertHint } from './components/CertHint';
import { CertResultsTable } from './components/CertResultsTable';
import { CertReissueModal } from './components/CertReissueModal';

interface CertificatesTabProps {
  collectionId: string;
  canReissue: boolean;
}

interface ReissueTarget {
  userId: string;
  userName: string;
  batchId: string;
  batchName: string;
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({ collectionId, canReissue }) => {
  const { t } = useAppI18n();
  const telemetry = useTelemetry();
  const [uniqueId, setUniqueId] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [reissueTarget, setReissueTarget] = useState<ReissueTarget | null>(null);
  const [reissueStatus, setReissueStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { mutate: searchUser, data: searchResult, isPending: searching, error: searchError, reset: resetSearch } = useCertUserSearch();
  const { mutate: reissueCert, isPending: reissuing } = useReissueCert();

  const isContentCreator = useIsContentCreator();
  const isMentor = useIsMentor();
  const { data: mentorBatches, isLoading: isMentorBatchesLoading } = useBatchListForMentor(collectionId, { enabled: isMentor && !isContentCreator });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueId.trim()) return;
    resetSearch();
    setReissueStatus(null);
    searchUser({ userName: uniqueId.trim(), courseId: collectionId });
  };

  const handleReissueConfirm = () => {
    if (!reissueTarget) return;
    setReissueStatus(null);
    reissueCert(
      {
        courseId: collectionId,
        batchId: reissueTarget.batchId,
        userIds: [reissueTarget.userId],
      },
      {
        onSuccess: () => {
          setReissueStatus({ type: 'success', message: t('certificate.reissuedSuccessfully') });
          setReissueTarget(null);
          telemetry.audit({
            edata: {
              props: ['courseId', 'batchId', 'userIds'],
              prevstate: 'Issued',
              state: 'Reissued',
            },
            object: { id: collectionId, type: 'Course' },
          });
        },
        onError: (err: Error) => {
          setReissueStatus({ type: 'error', message: err.message ?? t('certificate.reissueFailed') });
          setReissueTarget(null);
        },
      }
    );
  };

  const certUser = searchResult?.data?.response ?? null;

  // If the user only has the mentor role, they should only see batches they mentor.
  const mentorBatchIds = mentorBatches?.map(b => b.id) ?? [];
  const displayBatches: CertUserBatch[] = certUser?.courses?.batches?.filter((b: CertUserBatch) => {
    if (!isContentCreator && isMentor) {
      if (isMentorBatchesLoading) return true; // Show all until we know which ones to filter
      return mentorBatchIds.includes(b.batchId);
    }
    return true; // Creators see all
  }) ?? [];



  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white rounded-2xl" data-testid="certificates-tab">
      {/* Search row */}
      <form className="flex items-center gap-3 mb-6" onSubmit={handleSearch} data-testid="cert-search-form">
        <Input
          type="text"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value)}
          placeholder={t('certificatesTab.enterSunbirdId')}
          className="max-w-md"
          data-testid="unique-id-input"
        />
        <Button
          type="submit"
          className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-rubik transition-colors"
          disabled={searching || !uniqueId.trim()}
          data-testid="search-btn"
          data-edataid="certificate-user-search"
          data-pageid="course-dashboard-certificates"
        >
          {searching ? t('certificatesTab.searching') : t('certificatesTab.search')}
        </Button>
      </form>

      <CertHint hintOpen={hintOpen} setHintOpen={setHintOpen} />
      {reissueStatus && (
        <p
          className={reissueStatus.type === 'success' ? 'text-green-600 text-sm font-medium mt-3' : 'text-red-600 text-sm font-medium mt-3'}
          data-testid="reissue-status"
        >
          {reissueStatus.message}
        </p>
      )}

      <CertResultsTable
        certUser={certUser}
        batches={displayBatches}
        searchError={searchError}
        uniqueId={uniqueId}
        isOwner={canReissue}
        setReissueTarget={setReissueTarget}
      />

      <CertReissueModal
        reissueTarget={reissueTarget}
        reissuing={reissuing}
        onClose={() => setReissueTarget(null)}
        onConfirm={handleReissueConfirm}
      />
    </div>
  );
};

export default CertificatesTab;
