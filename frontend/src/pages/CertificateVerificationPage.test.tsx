import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams, useSearchParams } from 'react-router-dom';
import CertificateVerificationPage from './CertificateVerificationPage';
import {
  decodePathBData,
  fetchPathCData,
  verifyCertificate,
} from '@/services/CertificateVerificationService';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import type { SignedVC } from '@/types/certificateVerification';

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useSearchParams: vi.fn(),
  };
});

vi.mock('@/services/CertificateVerificationService', () => ({
  decodePathBData: vi.fn(),
  fetchPathCData: vi.fn(),
  verifyCertificate: vi.fn(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
  useSystemSetting: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────

const mockVC = {} as SignedVC;

const mockCertificate = {
  issuedTo: 'Jane Doe',
  trainingName: 'Advanced TypeScript',
  issuanceDate: '2024-03-15T00:00:00Z',
};

const defaultSystemSetting = {
  data: {
    data: {
      response: {
        id: 'certContextOrigins',
        field: 'certContextOrigins',
        value: 'https://downloadableartifacts.blob.core.windows.net',
      },
    },
    status: 200,
  },
  isLoading: false,
};

// Wrap with MemoryRouter — required because the page renders <Link>
function renderPage() {
  return render(
    <MemoryRouter>
      <CertificateVerificationPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

// ── Loading state ─────────────────────────────────────────────────────────

describe('loading state', () => {
  beforeEach(() => {
    vi.mocked(useSystemSetting).mockReturnValue(defaultSystemSetting as any);
    vi.mocked(useParams).mockReturnValue({ certificateId: 'cert-123' } as any);
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams({}),
      vi.fn(),
    ] as any);
    vi.mocked(fetchPathCData).mockImplementation(() => new Promise(() => {}));
    vi.mocked(decodePathBData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: true, certificateData: mockCertificate });
  });

  it('shows the loading spinner while verifying', () => {
    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });
});

// ── Verified state ────────────────────────────────────────────────────────

describe('verified state', () => {
  beforeEach(() => {
    vi.mocked(useSystemSetting).mockReturnValue(defaultSystemSetting as any);
    vi.mocked(useParams).mockReturnValue({ certificateId: 'cert-123' } as any);
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams({}),
      vi.fn(),
    ] as any);
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(decodePathBData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: true, certificateData: mockCertificate });
  });

  it('shows the verified heading', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('certificate.verified')).toBeInTheDocument());
  });

  it('renders the credential holder name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
  });

  it('renders the certification program name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument());
  });

  it('shows credential holder and program labels', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('certificate.credentialHolder')).toBeInTheDocument();
      expect(screen.getByText('certificate.certificationProgram')).toBeInTheDocument();
    });
  });

  it('shows the status label and active badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('certificate.status')).toBeInTheDocument();
      expect(screen.getByText('certificate.activeAndValid')).toBeInTheDocument();
    });
  });
});

// ── Service routing ───────────────────────────────────────────────────────

describe('service routing', () => {
  beforeEach(() => {
    vi.mocked(useSystemSetting).mockReturnValue(defaultSystemSetting as any);
    vi.mocked(decodePathBData).mockResolvedValue(mockVC);
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: true, certificateData: mockCertificate });
  });

  it('calls fetchPathCData when no ?data param is present', async () => {
    vi.mocked(useParams).mockReturnValue({ certificateId: 'cert-123' } as any);
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams({}),
      vi.fn(),
    ] as any);

    renderPage();
    await waitFor(() => expect(vi.mocked(fetchPathCData)).toHaveBeenCalledWith('cert-123'));
    expect(vi.mocked(decodePathBData)).not.toHaveBeenCalled();
  });

  it('calls decodePathBData when ?data param is present', async () => {
    vi.mocked(useParams).mockReturnValue({ certificateId: 'cert-123' } as any);
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams({ data: 'base64encodeddata' }),
      vi.fn(),
    ] as any);

    renderPage();
    await waitFor(() => expect(vi.mocked(decodePathBData)).toHaveBeenCalledWith('base64encodeddata'));
    expect(vi.mocked(fetchPathCData)).not.toHaveBeenCalled();
  });
});

// ── Multi-Origin Trust Support ────────────────────────────────────────────

describe('multi-origin trust support', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ certificateId: 'cert-123' } as any);
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams({}),
      vi.fn(),
    ] as any);
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({
      verified: true,
      certificateData: mockCertificate,
    });
  });

  it('passes single trusted origin to verifyCertificate', async () => {
    vi.mocked(useSystemSetting).mockReturnValue({
      data: {
        data: {
          response: {
            id: 'certContextOrigins',
            field: 'certContextOrigins',
            value: 'https://downloadableartifacts.blob.core.windows.net',
          },
        },
        status: 200,
      },
      isLoading: false,
    } as any);

    renderPage();
    await waitFor(() =>
      expect(vi.mocked(verifyCertificate)).toHaveBeenCalledWith(
        mockVC,
        ['https://downloadableartifacts.blob.core.windows.net'],
      ),
    );
  });

  it('parses comma-separated trusted origins and passes them to verifyCertificate', async () => {
    vi.mocked(useSystemSetting).mockReturnValue({
      data: {
        data: {
          response: {
            id: 'certContextOrigins',
            field: 'certContextOrigins',
            value: 'https://url1.com,https://url2.com,https://url3.com',
          },
        },
        status: 200,
      },
      isLoading: false,
    } as any);

    renderPage();
    await waitFor(() =>
      expect(vi.mocked(verifyCertificate)).toHaveBeenCalledWith(
        mockVC,
        ['https://url1.com', 'https://url2.com', 'https://url3.com'],
      ),
    );
  });

  it('ignores invalid URLs and passes only valid origins', async () => {
    vi.mocked(useSystemSetting).mockReturnValue({
      data: {
        data: {
          response: {
            id: 'certContextOrigins',
            field: 'certContextOrigins',
            value: 'https://valid.com,invalid-url,https://another-valid.com',
          },
        },
        status: 200,
      },
      isLoading: false,
    } as any);

    renderPage();
    await waitFor(() =>
      expect(vi.mocked(verifyCertificate)).toHaveBeenCalledWith(
        mockVC,
        ['https://valid.com', 'https://another-valid.com'],
      ),
    );
  });

  it('passes empty array when system setting has no value', async () => {
    vi.mocked(useSystemSetting).mockReturnValue({
      data: {
        data: {
          response: {
            id: 'certContextOrigins',
            field: 'certContextOrigins',
            value: undefined,
          },
        },
        status: 200,
      },
      isLoading: false,
    } as any);

    renderPage();
    await waitFor(() =>
      expect(vi.mocked(verifyCertificate)).toHaveBeenCalledWith(mockVC, []),
    );
  });
});

// ── Failed state ──────────────────────────────────────────────────────────

describe('failed state', () => {
  beforeEach(() => {
    vi.mocked(useSystemSetting).mockReturnValue(defaultSystemSetting as any);
    vi.mocked(useParams).mockReturnValue({ certificateId: 'cert-123' } as any);
    vi.mocked(useSearchParams).mockReturnValue([
      new URLSearchParams({}),
      vi.fn(),
    ] as any);
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(decodePathBData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: true, certificateData: mockCertificate });
  });

  it('shows failed heading when verifyCertificate returns verified: false', async () => {
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: false, error: 'Signature mismatch' });

    renderPage();
    await waitFor(() => expect(screen.getByText('certificate.verificationFailed')).toBeInTheDocument());
    expect(screen.getByText('certificate.couldNotVerify')).toBeInTheDocument();
    expect(screen.queryByText('Signature mismatch')).not.toBeInTheDocument();
  });

  it('shows failed state when fetchPathCData throws', async () => {
    vi.mocked(fetchPathCData).mockRejectedValue(new Error('Registry unavailable'));

    renderPage();
    await waitFor(() => expect(screen.getByText('certificate.verificationFailed')).toBeInTheDocument());
    expect(screen.queryByText('Registry unavailable')).not.toBeInTheDocument();
  });

  it('shows failed state immediately when certificateId is missing', async () => {
    vi.mocked(useParams).mockReturnValue({} as any);

    renderPage();
    await waitFor(() => expect(screen.getByText('certificate.verificationFailed')).toBeInTheDocument());
    expect(vi.mocked(fetchPathCData)).not.toHaveBeenCalled();
  });

  it('shows the invalid status badge in the failed state', async () => {
    vi.mocked(fetchPathCData).mockRejectedValue(new Error('error'));

    renderPage();
    await waitFor(() => expect(screen.getByText('certificate.invalid')).toBeInTheDocument());
  });

  it('renders back-to-home link in failed state', async () => {
    vi.mocked(fetchPathCData).mockRejectedValue(new Error('error'));

    renderPage();
    await waitFor(() => expect(screen.getByText('certificate.backToHome')).toBeInTheDocument());
  });
});
