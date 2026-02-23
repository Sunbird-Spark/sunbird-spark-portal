import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCertificateModalState } from './useCertificateModalState';

/* ── Hoist mocks so they're available in vi.mock factories ── */
const { mockCreateAsset, mockUploadAsset, mockReadCertTemplate, mockAddTemplateToBatch } = vi.hoisted(() => ({
  mockCreateAsset: vi.fn(),
  mockUploadAsset: vi.fn().mockResolvedValue({ data: { artifactUrl: 'https://cdn.example.com/cert.svg' }, status: 200, headers: {} }),
  mockReadCertTemplate: vi.fn(),
  mockAddTemplateToBatch: vi.fn(),
}));

const { mockInvalidateQueries, mockRefetchQueries } = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn().mockResolvedValue(undefined),
  mockRefetchQueries: vi.fn().mockResolvedValue(undefined),
}));

/* ── Mock @tanstack/react-query ── */
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    refetchQueries: mockRefetchQueries,
  }),
  useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}));

/* ── Mock useCertificate ── */
vi.mock('@/hooks/useCertificate', () => ({
  useCertTemplates: () => ({ data: [], isLoading: false }),
}));

/* ── Mock certificateService ── */
vi.mock('@/services/CertificateService', () => ({
  certificateService: {
    createAsset: mockCreateAsset,
    uploadAsset: mockUploadAsset,
    readCertTemplate: mockReadCertTemplate,
    addTemplateToBatch: mockAddTemplateToBatch,
  },
}));

/* ── Mock userUtils ── */
vi.mock('./utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils')>();
  return {
    ...original,
    resolveUserAndOrg: vi.fn().mockResolvedValue({
      userId: 'user-1',
      rootOrgId: 'org-1',
      userName: 'Test User',
    }),
  };
});

/* ── Mock global fetch for SVG download ── */
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('<svg/>'),
});

describe('useCertificateModalState', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUploadAsset.mockResolvedValue({ data: { artifactUrl: 'https://cdn.example.com/cert.svg' }, status: 200, headers: {} });
  });

  function renderModalState(existingCertTemplates = {}) {
    return renderHook(() =>
      useCertificateModalState('course-1', 'batch-1', existingCertTemplates, onOpenChange)
    );
  }

  /* ── Initial state ── */
  it('initializes with default values when no existing certificates', () => {
    const { result } = renderModalState();
    expect(result.current.view).toBe('main');
    expect(result.current.issueTo).toBe('all');
    expect(result.current.issueToAccepted).toBe(false);
    expect(result.current.progressRule).toBe('100');
    expect(result.current.selectedTemplateId).toBeNull();
    expect(result.current.step).toBe('idle');
    expect(result.current.hasExistingCert).toBe(false);
    expect(result.current.certTab).toBe('change');
  });

  it('sets certTab to "current" when existingCertTemplates is non-empty', () => {
    const { result } = renderModalState({ 'tmpl-1': { name: 'Old Cert' } });
    expect(result.current.hasExistingCert).toBe(true);
    expect(result.current.certTab).toBe('current');
  });

  /* ── setters ── */
  it('setIssueTo updates issueTo state', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setIssueTo('org');
    });
    expect(result.current.issueTo).toBe('org');
  });

  it('setProgressRule updates progressRule state', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setProgressRule('80');
    });
    expect(result.current.progressRule).toBe('80');
  });

  it('setIssueToAccepted updates issueToAccepted state', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setIssueToAccepted(true);
    });
    expect(result.current.issueToAccepted).toBe(true);
  });

  it('setView updates view state', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setView('createTemplate');
    });
    expect(result.current.view).toBe('createTemplate');
  });

  it('setSelectedTemplateId updates selectedTemplateId', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setSelectedTemplateId('tmpl-abc');
    });
    expect(result.current.selectedTemplateId).toBe('tmpl-abc');
  });

  it('setPreviewTemplate updates previewTemplate', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setPreviewTemplate('tmpl-preview');
    });
    expect(result.current.previewTemplate).toBe('tmpl-preview');
  });

  it('setErrorMsg updates errorMsg', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setErrorMsg('Something failed');
    });
    expect(result.current.errorMsg).toBe('Something failed');
  });

  it('setCertTab updates certTab', () => {
    const { result } = renderModalState({ 'tmpl-1': {} });
    act(() => {
      result.current.setCertTab('change');
    });
    expect(result.current.certTab).toBe('change');
  });

  /* ── handleNewTmplField ── */
  it('handleNewTmplField updates the correct field', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.handleNewTmplField('certTitle', 'My Certificate');
    });
    expect(result.current.newTmpl.certTitle).toBe('My Certificate');
  });

  it('handleNewTmplField updates termsAccepted boolean', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.handleNewTmplField('termsAccepted', true);
    });
    expect(result.current.newTmpl.termsAccepted).toBe(true);
  });

  /* ── isNewTmplValid ── */
  it('isNewTmplValid is false when form is empty', () => {
    const { result } = renderModalState();
    expect(result.current.isNewTmplValid).toBe(false);
  });

  it('isNewTmplValid is true when all required fields are filled', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.handleNewTmplField('certTitle', 'My Cert');
      result.current.handleNewTmplField('name', 'John Doe');
      result.current.handleNewTmplField('logo1', { preview: 'logo.png', artifactUrl: null, file: null });
      result.current.handleNewTmplField('sig1', { preview: 'sig.png', artifactUrl: null, file: null });
      result.current.handleNewTmplField('sig1Designation', 'Director');
      result.current.handleNewTmplField('termsAccepted', true);
    });
    expect(result.current.isNewTmplValid).toBe(true);
  });

  /* ── isAddCertEnabled ── */
  it('isAddCertEnabled is false when no template selected', () => {
    const { result } = renderModalState();
    expect(result.current.isAddCertEnabled).toBe(false);
  });

  it('isAddCertEnabled is false when template selected but issueToAccepted is false', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setSelectedTemplateId('tmpl-1');
    });
    expect(result.current.isAddCertEnabled).toBe(false);
  });

  it('isAddCertEnabled is true when template selected and issueToAccepted', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setSelectedTemplateId('tmpl-1');
      result.current.setIssueToAccepted(true);
    });
    expect(result.current.isAddCertEnabled).toBe(true);
  });

  /* ── handleClose ── */
  it('handleClose calls onOpenChange with false', () => {
    const { result } = renderModalState();
    act(() => {
      result.current.handleClose();
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /* ── handleRefreshTemplates ── */
  it('handleRefreshTemplates calls invalidateQueries', async () => {
    const { result } = renderModalState();
    await act(async () => {
      await result.current.handleRefreshTemplates();
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['certTemplates'] });
  });

  it('handleRefreshTemplates sets and unsets templatesRefreshing', async () => {
    const { result } = renderModalState();
    const promise = act(async () => {
      await result.current.handleRefreshTemplates();
    });
    await promise;
    expect(result.current.templatesRefreshing).toBe(false);
  });

  /* ── handleAddCertificate ── */
  it('handleAddCertificate does nothing when no selectedTemplateId', async () => {
    const { result } = renderModalState();
    await act(async () => {
      await result.current.handleAddCertificate();
    });
    expect(mockAddTemplateToBatch).not.toHaveBeenCalled();
    expect(result.current.step).toBe('idle');
  });

  it('handleAddCertificate returns early when selectedTemplate not in certTemplates', async () => {
    const { result } = renderModalState();
    act(() => {
      result.current.setSelectedTemplateId('nonexistent-tmpl');
    });
    await act(async () => {
      await result.current.handleAddCertificate();
    });
    // certTemplates is empty from mock, so selectedTemplate is null → early return
    expect(result.current.step).toBe('idle');
  });

  /* ── handleSaveNewTemplate ── */
  it('handleSaveNewTemplate calls createAsset and sets templateCreated on success', async () => {
    mockCreateAsset.mockResolvedValue({
      data: { identifier: 'new-asset-1' },
      status: 200,
      headers: {},
    });

    const { result } = renderModalState();
    act(() => {
      result.current.handleNewTmplField('certTitle', 'Test Cert');
      result.current.handleNewTmplField('name', 'John');
      result.current.handleNewTmplField('sig1Designation', 'Director');
    });

    await act(async () => {
      await result.current.handleSaveNewTemplate();
    });

    expect(mockCreateAsset).toHaveBeenCalledTimes(1);
    // After successful save, step should be templateCreated
    expect(result.current.step).toBe('templateCreated');
    expect(result.current.selectedTemplateId).toBe('new-asset-1');
  });

  it('handleSaveNewTemplate sets errorMsg on failure', async () => {
    mockCreateAsset.mockRejectedValue(new Error('Asset creation failed'));

    const { result } = renderModalState();
    await act(async () => {
      await result.current.handleSaveNewTemplate();
    });

    expect(result.current.errorMsg).toBe('Asset creation failed');
    expect(result.current.createLoading).toBe(false);
  });

  it('handleSaveNewTemplate handles case when createAsset returns no identifier', async () => {
    mockCreateAsset.mockResolvedValue({ data: {}, status: 200, headers: {} });

    const { result } = renderModalState();
    await act(async () => {
      await result.current.handleSaveNewTemplate();
    });

    expect(result.current.errorMsg).toBe('Failed to create certificate asset');
  });

  it('handleSaveNewTemplate includes sig2 in sigList when sig2Designation is provided', async () => {
    mockCreateAsset.mockResolvedValue({
      data: { identifier: 'asset-2' },
      status: 200,
      headers: {},
    });

    const { result } = renderModalState();
    act(() => {
      result.current.handleNewTmplField('certTitle', 'Test Cert');
      result.current.handleNewTmplField('name', 'John');
      result.current.handleNewTmplField('sig1Designation', 'Director');
      result.current.handleNewTmplField('sig2Designation', 'CEO');
    });

    await act(async () => {
      await result.current.handleSaveNewTemplate();
    });

    const assetCall = mockCreateAsset.mock.calls[0];
    const signatoryList = assetCall[0].signatoryList;
    expect(signatoryList.length).toBeGreaterThanOrEqual(2);
  });
});
