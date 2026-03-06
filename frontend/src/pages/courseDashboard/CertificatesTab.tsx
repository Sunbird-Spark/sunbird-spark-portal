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
        className="text-xs text-muted-foreground underline decoration-dotted mb-2 hover:opacity-80"
        onClick={() => setHintOpen((o) => !o)}
        data-testid="hint-toggle"
      >
        {hintOpen ? '▲' : '▼'} {t('certificatesTab.whatIsSunbirdId')}
      </button>

      {hintOpen && (
        <div className="bg-accent border border-border rounded-lg p-4 text-sm max-w-md text-foreground" data-testid="hint-box">
          <strong>{t('certificatesTab.howToFindSunbirdId')}</strong>
          <ol className="mt-1.5 ml-5 list-decimal">
            <li dangerouslySetInnerHTML={{ __html: t('certificatesTab.clickProfileTab') }} />
            <li>{t('certificatesTab.sunbirdIdDisplayed')}</li>
          </ol>
        </div>
      )}

      {/* Search error section was moved inside the table */}

      {/* Re-issue status */}
      {reissueStatus && (
        <p
          className={reissueStatus.type === 'success' ? 'text-green-600 text-sm font-medium mt-3' : 'text-red-600 text-sm font-medium mt-3'}
          data-testid="reissue-status"
        >
          {reissueStatus.message}
        </p>
      )}

      {/* Results table */}
      {(certUser || searchError) && !searching && (
        <div className="overflow-x-auto border border-border rounded-lg mt-6" data-testid="results-table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.batchName')}</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.userName')}</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.courseProgress')}</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.criteriaMet')}</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.action')}</th>
              </tr>
            </thead>
            <tbody>
              {searchError ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-600 border-b border-border" data-testid="search-error">
                    {(searchError as Error).message ?? t('certificatesTab.searchFailed')}
                  </td>
                </tr>
              ) : !hasBatches ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground border-b border-border" data-testid="no-results">
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
                    <tr key={batch.batchId ?? idx} data-testid={`result-row-${idx}`}>
                      <td className="border-b border-border p-3 text-foreground font-semibold">
                        <div className="flex items-center gap-2">
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
                      <td className="border-b border-border p-3 text-foreground">{certUser.userName}</td>
                      <td className="border-b border-border p-3 text-foreground">{batch.completionPercentage ?? 0}%</td>
                      <td className="border-b border-border p-3 text-foreground">
                        <span className={criteriaMet === t('certificatesTab.yes') ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          {criteriaMet}
                        </span>
                      </td>
                      <td className="border-b border-border p-3 text-foreground">
                        {isOwner ? (
                          <Button
                            variant="link"
                            size="sm"
                            className={cn(
                              "h-auto p-0 transition-colors",
                              criteriaMet === t('certificatesTab.yes') ? "text-sunbird-brick" : "text-muted-foreground/50 cursor-not-allowed hover:no-underline"
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
                            className="text-xs text-muted-foreground font-['Rubik']"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]" data-testid="reissue-modal">
          <div className="bg-card rounded-xl p-8 w-full max-w-md shadow-lg mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">{t('certificate.reissueCertificate')}</h3>
            <p className="text-sm text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: t('certificate.reissueConfirmation', { userName: reissueTarget.userName, batchName: reissueTarget.batchName }) }} />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="font-['Rubik']"
                onClick={() => setReissueTarget(null)}
                data-testid="modal-no-btn"
                disabled={reissuing}
              >
                {t('certificatesTab.no')}
              </Button>
              <Button
                className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-['Rubik'] transition-colors"
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
