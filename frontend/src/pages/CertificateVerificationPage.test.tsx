import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams, useSearchParams } from 'react-router-dom';
import CertificateVerificationPage from './CertificateVerificationPage';
import {
  decodePathBData,
  fetchPathCData,
  verifyCertificate,
} from '@/services/CertificateVerificationService';
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

// ── Helpers ───────────────────────────────────────────────────────────────

const mockVC = {} as SignedVC;

const mockCertificate = {
  issuedTo: 'Jane Doe',
  trainingName: 'Advanced TypeScript',
  issuanceDate: '2024-03-15T00:00:00Z',
};

function setupParams(certificateId: string | undefined, dataParam?: string) {
  vi.mocked(useParams).mockReturnValue({ certificateId });
  vi.mocked(useSearchParams).mockReturnValue([
    new URLSearchParams(dataParam ? { data: dataParam } : {}),
    vi.fn(),
  ]);
}

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
  it('shows the loading spinner while verifying', () => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByText('certificate.verifying')).toBeInTheDocument();
  });
});

// ── Verified state ────────────────────────────────────────────────────────

describe('verified state', () => {
  beforeEach(() => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({
      verified: true,
      certificateData: mockCertificate,
    });
  });

  it('shows the verified heading', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('certificate.verified')).toBeInTheDocument(),
    );
  });

  it('renders the credential holder name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
  });

  it('renders the certification program name', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument(),
    );
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
  it('calls fetchPathCData when no ?data param is present', async () => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: true, certificateData: mockCertificate });

    renderPage();
    await waitFor(() => expect(fetchPathCData).toHaveBeenCalledWith('cert-123'));
    expect(decodePathBData).not.toHaveBeenCalled();
  });

  it('calls decodePathBData when ?data param is present', async () => {
    setupParams('cert-123', 'base64encodeddata');
    vi.mocked(decodePathBData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: true, certificateData: mockCertificate });

    renderPage();
    await waitFor(() => expect(decodePathBData).toHaveBeenCalledWith('base64encodeddata'));
    expect(fetchPathCData).not.toHaveBeenCalled();
  });
});

// ── Failed state ──────────────────────────────────────────────────────────

describe('failed state', () => {
  it('shows failed heading when verifyCertificate returns verified: false', async () => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockResolvedValue(mockVC);
    vi.mocked(verifyCertificate).mockResolvedValue({ verified: false, error: 'Signature mismatch' });

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('certificate.verificationFailed')).toBeInTheDocument(),
    );
    // Raw error details are not exposed to the user — only the generic message is shown
    expect(screen.getByText('certificate.couldNotVerify')).toBeInTheDocument();
    expect(screen.queryByText('Signature mismatch')).not.toBeInTheDocument();
  });

  it('shows failed state when fetchPathCData throws', async () => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockRejectedValue(new Error('Registry unavailable'));

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('certificate.verificationFailed')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Registry unavailable')).not.toBeInTheDocument();
  });

  it('shows failed state immediately when certificateId is missing', async () => {
    setupParams(undefined);

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('certificate.verificationFailed')).toBeInTheDocument(),
    );
    expect(fetchPathCData).not.toHaveBeenCalled();
  });

  it('shows the invalid status badge in the failed state', async () => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockRejectedValue(new Error('error'));

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('certificate.invalid')).toBeInTheDocument(),
    );
  });

  it('renders back-to-home link in failed state', async () => {
    setupParams('cert-123');
    vi.mocked(fetchPathCData).mockRejectedValue(new Error('error'));

    renderPage();

    await waitFor(() =>
      expect(screen.getByText('certificate.backToHome')).toBeInTheDocument(),
    );
  });
});
