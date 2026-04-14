import React from 'react';
import { FiCheckCircle, FiAward } from 'react-icons/fi';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useAppI18n } from '@/hooks/useAppI18n';
import type { CertUserBatch } from '@/services/CertificateTypes';

interface ReissueTarget {
  userId: string;
  userName: string;
  batchId: string;
  batchName: string;
}

interface CertResultsTableProps {
  certUser: any;
  batches: CertUserBatch[];
  searchError: any;
  uniqueId: string;
  isOwner: boolean;
  setReissueTarget: (target: ReissueTarget) => void;
}

export const CertResultsTable: React.FC<CertResultsTableProps> = ({
  certUser,
  batches,
  searchError,
  uniqueId,
  isOwner,
  setReissueTarget,
}) => {
  const { t } = useAppI18n();
  const hasBatches = certUser && batches.length > 0;

  if (!certUser && !searchError) return null;

  return (
    <div className="overflow-x-auto border border-border rounded-lg" data-testid="results-table-wrapper">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left font-rubik font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.batchName')}</th>
            <th className="text-left font-rubik font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.userName')}</th>
            <th className="text-left font-rubik font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.courseProgress')}</th>
            <th className="text-left font-rubik font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.criteriaMet')}</th>
            <th className="text-left font-rubik font-medium text-muted-foreground border-b border-border p-3">{t('certificatesTab.action')}</th>
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
            batches.map((batch: CertUserBatch, idx: number) => {
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
                        data-edataid="certificate-reissue-open"
                        data-pageid="course-dashboard-certificates"
                        data-objid={certUser.userId}
                        data-objtype="User"
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
                        className="text-xs text-muted-foreground font-rubik"
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
  );
};
