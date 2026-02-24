import React, { useState } from 'react';
import { useCertUserSearch, useReissueCert } from '@/hooks/useCourseDashboard';
import type { CertUserBatch } from '@/services/CertificateTypes';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface CertificatesTabProps {
  collectionId: string;
}

interface ReissueTarget {
  userId: string;
  userName: string;
  batchId: string;
  batchName: string;
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({ collectionId }) => {
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
          setReissueStatus({ type: 'success', message: 'Certificate re-issued successfully.' });
          setReissueTarget(null);
        },
        onError: (err: Error) => {
          setReissueStatus({ type: 'error', message: err.message ?? 'Failed to re-issue certificate.' });
          setReissueTarget(null);
        },
      }
    );
  };

  const certUser = searchResult?.data?.response ?? null;

  const hasBatches = certUser && Array.isArray(certUser?.courses?.batches) && certUser.courses.batches.length > 0;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white" data-testid="certificates-tab">
      {/* Search row */}
      <form className="flex items-center gap-3 mb-6" onSubmit={handleSearch} data-testid="cert-search-form">
        <Input
          type="text"
          value={uniqueId}
          onChange={(e) => setUniqueId(e.target.value)}
          placeholder="Enter Unique ID"
          className="max-w-md"
          data-testid="unique-id-input"
        />
        <Button
          type="submit"
          className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-['Rubik'] transition-colors"
          disabled={searching || !uniqueId.trim()}
          data-testid="search-btn"
        >
          {searching ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {/* Hint */}
      <button
        type="button"
        className="text-xs text-muted-foreground underline decoration-dotted mb-5 hover:opacity-80"
        onClick={() => setHintOpen((o) => !o)}
        data-testid="hint-toggle"
      >
        {hintOpen ? '▲' : '▼'} What is Unique ID?
      </button>

      {hintOpen && (
        <div className="bg-accent border border-border rounded-lg p-4 mb-6 text-sm max-w-md text-foreground" data-testid="hint-box">
          <strong>How to find your Unique ID:</strong>
          <ol className="mt-1.5 ml-5 list-decimal">
            <li>Click the <strong>Profile</strong> tab</li>
            <li>The Unique ID is displayed below the user name</li>
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
        <div className="overflow-x-auto border border-border rounded-lg" data-testid="results-table-wrapper">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">Batch Name</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">User Name</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">Course Progress</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">Criteria Met</th>
                <th className="text-left font-['Rubik'] font-medium text-muted-foreground border-b border-border p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {searchError ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-600 border-b border-border" data-testid="search-error">
                    {(searchError as Error).message ?? 'Search failed.'}
                  </td>
                </tr>
              ) : !hasBatches ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground border-b border-border" data-testid="no-results">
                    No certificate records found for "{certUser?.userName ?? uniqueId}".
                  </td>
                </tr>
              ) : (
                certUser?.courses.batches.map((batch: CertUserBatch, idx: number) => {
                const criteriaMet = batch.issuedCertificates && batch.issuedCertificates.length > 0 ? 'Yes' : 'No';
                return (
                  <tr key={batch.batchId ?? idx} data-testid={`result-row-${idx}`}>
                    <td className="border-b border-border p-3 text-foreground font-semibold">{batch.name ?? batch.batch?.name ?? batch.batchId}</td>
                    <td className="border-b border-border p-3 text-foreground">{certUser.userName}</td>
                    <td className="border-b border-border p-3 text-foreground">{batch.completionPercentage ?? 0}%</td>
                    <td className="border-b border-border p-3 text-foreground">
                      <span className={criteriaMet === 'Yes' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {criteriaMet}
                      </span>
                    </td>
                    <td className="border-b border-border p-3 text-foreground">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sunbird-brick"
                        data-testid={`reissue-btn-${idx}`}
                        onClick={() =>
                          setReissueTarget({
                            userId: certUser.userId,
                            userName: certUser.userName,
                            batchId: batch.batchId,
                            batchName: batch.name ?? batch.batchId,
                          })
                        }
                      >
                        Re-issue
                      </Button>
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
            <h3 className="text-lg font-semibold text-foreground mb-3">Re-issue Certificate</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Re-issue the certificate for <strong>{reissueTarget.userName}</strong> in batch{' '}
              <strong>{reissueTarget.batchName}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="font-['Rubik']"
                onClick={() => setReissueTarget(null)}
                data-testid="modal-no-btn"
                disabled={reissuing}
              >
                No
              </Button>
              <Button
                className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-['Rubik'] transition-colors"
                onClick={handleReissueConfirm}
                data-testid="modal-yes-btn"
                disabled={reissuing}
              >
                {reissuing ? 'Re-issuing…' : 'Yes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesTab;
