import React, { useState } from 'react';
import { useCertUserSearch, useReissueCert } from '@/hooks/useCourseDashboard';
import type { CertUserBatch } from '@/services/CertificateTypes';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FiCheckCircle, FiAward } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { useAppI18n } from '@/hooks/useAppI18n';

interface CertificatesTabProps {
  collectionId: string;
  isOwner: boolean;
}

interface ReissueTarget {
  userId: string;
  userName: string;
  batchId: string;
  batchName: string;
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({ collectionId, isOwner }) => {
  const { t } = useAppI18n();
  const [uniqueId, setUniqueId] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [reissueTarget, setReissueTarget] = useState<ReissueTarget | null>(null);
  const [reissueStatus, setReissueStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { mutate: searchUser, data: searchResult, isPending: searching, error: searchError, reset: resetSearch } = useCertUserSearch();
  const { mutate: reissueCert, isPending: reissuing } = useReissueCert();

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
        },
        onError: (err: Error) => {
          setReissueStatus({ type: 'error', message: err.message ?? t('certificate.reissueFailed') });
          setReissueTarget(null);
        },
      }
    );
  };

  const certUser = searchResult?.data?.response ?? null;

  const hasBatches = certUser && Array.isArray(certUser?.courses?.batches) && certUser.courses.batches.length > 0;

  return (
    <div className="certs-tab-container" data-testid="certificates-tab">
      {/* Search row */}
      <form className="certs-search-form" onSubmit={handleSearch} data-testid="cert-search-form">
        <div className="certs-search-input-wrapper">
          <Input
            type="text"
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value)}
            placeholder={t('certificatesTab.enterSunbirdId')}
            data-testid="unique-id-input"
          />
        </div>
        <Button
          type="submit"
          className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-['Rubik'] transition-colors"
          disabled={searching || !uniqueId.trim()}
          data-testid="search-btn"
        >
          {searching ? t('certificatesTab.searching') : t('certificatesTab.search')}
        </Button>
      </form>

      {/* Hint */}
      <button
        type="button"
        className="certs-hint-toggle-btn"
        onClick={() => setHintOpen((o) => !o)}
        data-testid="hint-toggle"
      >
        {hintOpen ? '▲' : '▼'} {t('certificatesTab.whatIsSunbirdId')}
      </button>

      {hintOpen && (
        <div className="certs-hint-content" data-testid="hint-box">
          <strong>{t('certificatesTab.howToFindSunbirdId')}</strong>
          <ol>
            <li dangerouslySetInnerHTML={{ __html: t('certificatesTab.clickProfileTab') }} />
            <li>{t('certificatesTab.sunbirdIdDisplayed')}</li>
          </ol>
        </div>
      )}

      {/* Re-issue status */}
      {reissueStatus && (
        <p
          className={`certs-status-message ${reissueStatus.type === 'success' ? 'certs-status-success' : 'certs-status-error'}`}
          data-testid="reissue-status"
        >
          {reissueStatus.message}
        </p>
      )}

      {/* Results table */}
      {(certUser || searchError) && !searching && (
        <div className="certs-results-wrapper" data-testid="results-table-wrapper">
          <table className="certs-table">
            <thead>
              <tr>
                <th>{t('certificatesTab.batchName')}</th>
                <th>{t('certificatesTab.userName')}</th>
                <th>{t('certificatesTab.courseProgress')}</th>
                <th>{t('certificatesTab.criteriaMet')}</th>
                <th>{t('certificatesTab.action')}</th>
              </tr>
            </thead>
            <tbody>
              {searchError ? (
                <tr>
                  <td colSpan={5} className="certs-search-error" data-testid="search-error">
                    {(searchError as Error).message ?? t('certificatesTab.searchFailed')}
                  </td>
                </tr>
              ) : !hasBatches ? (
                <tr>
                  <td colSpan={5} className="certs-no-results-cell" data-testid="no-results">
                    {t('certificatesTab.noCertificateRecords', { userName: certUser?.userName ?? uniqueId })}
                  </td>
                </tr>
              ) : (
                certUser?.courses.batches.map((batch: CertUserBatch, idx: number) => {
                  const hasCertificate = batch.issuedCertificates && batch.issuedCertificates.length > 0;
                  const isCompleted = batch.status === 2;
                  const criteriaMet = isCompleted ? t('certificatesTab.yes') : t('certificatesTab.no');
                  const showIndicator = hasCertificate || isCompleted;

                  return (
                    <tr key={batch.batchId ?? idx} className="certs-table-row" data-testid={`result-row-${idx}`}>
                      <td className="certs-table-cell certs-batch-name-cell">
                        <div className="certs-batch-name-content">
                          {batch.name ?? batch.batch?.name ?? batch.batchId}
                          {showIndicator && (
                            <span title={hasCertificate ? t('certificatesTab.certificateIssued') : t('certificatesTab.courseCompleted')}>
                              {hasCertificate ? (
                                <FiAward className="w-4 h-4 text-sunbird-brick" />
                              ) : (
                                <FiCheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="certs-table-cell">{certUser.userName}</td>
                      <td className="certs-table-cell">{batch.completionPercentage ?? 0}%</td>
                      <td className="certs-table-cell">
                        <span className={criteriaMet === t('certificatesTab.yes') ? 'certs-criteria-met-yes' : 'certs-criteria-met-no'}>
                          {criteriaMet}
                        </span>
                      </td>
                      <td className="certs-table-cell">
                        {isOwner ? (
                          <Button
                            variant="link"
                            size="sm"
                            className={cn(
                              "certs-reissue-btn",
                              criteriaMet === t('certificatesTab.yes') ? "" : "certs-reissue-btn:disabled"
                            )}
                            data-testid={`reissue-btn-${idx}`}
                            disabled={criteriaMet === t('certificatesTab.no')}
                            title={criteriaMet === t('certificatesTab.no') ? t('certificatesTab.criteriaMustBeMet') : t('certificatesTab.reissueCertificate')}
                            onClick={() =>
                              setReissueTarget({
                                userId: certUser.userId,
                                userName: certUser.userName,
                                batchId: batch.batchId,
                                batchName: batch.name ?? batch.batchId,
                              })
                            }
                          >
                            {t('certificate.reissue')}
                          </Button>
                        ) : (
                          <span
                            className="certs-view-only-text"
                            data-testid={`reissue-view-only-${idx}`}
                          >
                            {t('certificatesTab.viewOnly')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation modal */}
      {reissueTarget && (
        <div className="certs-modal-overlay" data-testid="reissue-modal">
          <div className="certs-modal-content">
            <h3 className="certs-modal-title">{t('certificate.reissueCertificate')}</h3>
            <p className="certs-modal-body" dangerouslySetInnerHTML={{ __html: t('certificate.reissueConfirmation', { userName: reissueTarget.userName, batchName: reissueTarget.batchName }) }} />
            <div className="certs-modal-actions">
              <Button
                variant="outline"
                className="certs-modal-btn-cancel"
                onClick={() => setReissueTarget(null)}
                data-testid="modal-no-btn"
                disabled={reissuing}
              >
                {t('certificatesTab.no')}
              </Button>
              <Button
                className="certs-modal-btn-confirm"
                onClick={handleReissueConfirm}
                data-testid="modal-yes-btn"
                disabled={reissuing}
              >
                {reissuing ? t('certificate.reissuing') : t('certificatesTab.yes')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesTab;
