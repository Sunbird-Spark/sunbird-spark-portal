import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CertResultsTable } from './CertResultsTable';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, opts?: any) => {
      const map: Record<string, string> = {
        'certificatesTab.batchName': 'Batch Name',
        'certificatesTab.userName': 'User Name',
        'certificatesTab.courseProgress': 'Course Progress',
        'certificatesTab.criteriaMet': 'Criteria Met',
        'certificatesTab.action': 'Action',
        'certificatesTab.searchFailed': 'Search failed',
        'certificatesTab.yes': 'Yes',
        'certificatesTab.no': 'No',
        'certificatesTab.certificateIssued': 'Certificate Issued',
        'certificatesTab.courseCompleted': 'Course Completed',
        'certificatesTab.criteriaMustBeMet': 'Criteria must be met',
        'certificatesTab.reissueCertificate': 'Reissue Certificate',
        'certificatesTab.viewOnly': 'View Only',
        'certificate.reissue': 'Reissue',
        'certificatesTab.noCertificateRecords': 'No records for {{userName}}',
      };
      let result = map[key] ?? key;
      if (opts?.userName !== undefined) result = result.replace('{{userName}}', opts.userName);
      return result;
    },
  }),
}));

vi.mock('@/components/common/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span data-variant={variant}>{children}</span>,
}));

const baseCertUser = { userId: 'u1', userName: 'testuser' };
const batch = {
  batchId: 'b1',
  name: 'Test Batch',
  status: 2,
  completionPercentage: 100,
  issuedCertificates: [{ name: 'cert' }],
  batch: { batchId: 'b1', name: 'Test Batch', createdBy: 'admin' },
};

describe('CertResultsTable', () => {
  it('returns null when certUser and searchError are both falsy', () => {
    const { container } = render(
      <CertResultsTable
        certUser={null}
        batches={[]}
        searchError={null}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows searchError message when searchError is provided (line 50 true branch)', () => {
    render(
      <CertResultsTable
        certUser={null}
        batches={[]}
        searchError={new Error('Not found')}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('search-error')).toBeInTheDocument();
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('uses ?? fallback for searchError message when Error has no message (line 53)', () => {
    const errorNoMsg = { message: undefined };
    render(
      <CertResultsTable
        certUser={null}
        batches={[]}
        searchError={errorNoMsg as any}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('search-error')).toBeInTheDocument();
    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('shows no-results row when certUser exists but batches is empty (line 56)', () => {
    render(
      <CertResultsTable
        certUser={baseCertUser}
        batches={[]}
        searchError={null}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('uses uniqueId as fallback when certUser.userName is absent (line 59 ?? uniqueId branch)', () => {
    render(
      <CertResultsTable
        certUser={{ userId: 'u1', userName: undefined }}
        batches={[]}
        searchError={null}
        uniqueId="my-unique-id"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('no-results').textContent).toContain('my-unique-id');
  });

  it('renders rows and uses batch.name when available (line 73)', () => {
    render(
      <CertResultsTable
        certUser={baseCertUser}
        batches={[batch as any]}
        searchError={null}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('result-row-0')).toBeInTheDocument();
    expect(screen.getByText('Test Batch')).toBeInTheDocument();
  });

  it('uses ?? 0 when completionPercentage is null/undefined (line 86)', () => {
    const batchNoProgress = { ...batch, completionPercentage: null };
    render(
      <CertResultsTable
        certUser={baseCertUser}
        batches={[batchNoProgress as any]}
        searchError={null}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('result-row-0').textContent).toContain('0%');
  });

  it('shows viewOnly span when isOwner is false (line 119 false branch)', () => {
    render(
      <CertResultsTable
        certUser={baseCertUser}
        batches={[batch as any]}
        searchError={null}
        uniqueId="uid"
        isOwner={false}
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('reissue-view-only-0')).toBeInTheDocument();
    expect(screen.getByText('View Only')).toBeInTheDocument();
  });

  it('shows reissue button when isOwner is true (line 93 true branch)', () => {
    render(
      <CertResultsTable
        certUser={baseCertUser}
        batches={[batch as any]}
        searchError={null}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('reissue-btn-0')).toBeInTheDocument();
  });

  it('falls back to batch.batchId when batch.name is absent (line 73 ?? branch)', () => {
    const batchNoName = { ...batch, name: undefined, batch: undefined };
    render(
      <CertResultsTable
        certUser={baseCertUser}
        batches={[batchNoName as any]}
        searchError={null}
        uniqueId="uid"
        isOwner
        setReissueTarget={vi.fn()}
      />
    );
    expect(screen.getByTestId('result-row-0').textContent).toContain('b1');
  });
});
