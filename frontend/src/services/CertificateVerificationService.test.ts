import { decodePathBData, fetchPathCData, verifyCertificate } from './CertificateVerificationService';
import type { SignedVC } from '@/types/certificateVerification';
import * as certificateApi from '@/api/certificateApi';
import * as cryptoContext from '@/services/certificate/cryptoContext';

// ── Module mocks ──────────────────────────────────────────────────────────

vi.mock('jszip');
vi.mock('@/api/certificateApi');
vi.mock('@/services/certificate/cryptoContext');

import JSZip from 'jszip';

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockVC: SignedVC = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  issuanceDate: '2024-03-15T00:00:00Z',
  issuer: {
    id: 'https://issuer.example',
    publicKey: 'key-osid-abc',
  },
  credentialSubject: {
    name: 'Jane Doe',
    trainingName: 'Advanced TypeScript',
  },
  proof: {
    type: 'RsaSignature2018',
    verificationMethod: 'https://issuer.example/keys/1',
  },
};

const mockRsaSignature2018 = vi.fn();
const mockAssertionProofPurpose = vi.fn();
const mockVerify = vi.fn();
const mockDocumentLoader = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.mocked(cryptoContext.getCryptoModules).mockResolvedValue({
    jsigs: {
      verify: mockVerify,
      suites: { RsaSignature2018: mockRsaSignature2018 },
      purposes: { AssertionProofPurpose: mockAssertionProofPurpose },
      SECURITY_CONTEXT_URL: 'https://w3id.org/security/v2',
    },
    baseContexts: {},
  });
  vi.mocked(cryptoContext.prefetchContexts).mockResolvedValue(undefined);
  vi.mocked(cryptoContext.buildDocumentLoader).mockReturnValue(mockDocumentLoader);
  vi.mocked(certificateApi.getPublicKey).mockResolvedValue({ value: '-----BEGIN PUBLIC KEY-----' });
  mockVerify.mockResolvedValue({ verified: true });
});

// ── decodePathBData ───────────────────────────────────────────────────────

describe('decodePathBData', () => {
  const vcJson = JSON.stringify(mockVC);

  beforeEach(() => {
    const mockFileObj = { async: vi.fn().mockResolvedValue(vcJson) };
    vi.mocked(JSZip.loadAsync).mockResolvedValue({
      file: vi.fn().mockReturnValue(mockFileObj),
    } as unknown as JSZip);
  });

  it('returns a parsed SignedVC on success', async () => {
    vi.stubGlobal('atob', vi.fn().mockReturnValue('binary'));
    const result = await decodePathBData('dGVzdA==');
    expect(result).toEqual(mockVC);
  });

  it('normalizes URL-safe base64 before calling atob', async () => {
    const mockAtob = vi.fn().mockReturnValue('binary');
    vi.stubGlobal('atob', mockAtob);

    await decodePathBData('abc-def_ghi==');

    expect(mockAtob).toHaveBeenCalledWith('abc+def/ghi==');
  });

  it('throws if certificate.json is not found in the ZIP', async () => {
    vi.mocked(JSZip.loadAsync).mockResolvedValue({
      file: vi.fn().mockReturnValue(null),
    } as unknown as JSZip);
    vi.stubGlobal('atob', vi.fn().mockReturnValue('binary'));

    await expect(decodePathBData('dGVzdA==')).rejects.toThrow(
      'certificate.json not found in ZIP',
    );
  });

  it('throws a descriptive error if ZIP content is invalid JSON', async () => {
    const mockFileObj = { async: vi.fn().mockResolvedValue('not-json{{{') };
    vi.mocked(JSZip.loadAsync).mockResolvedValue({
      file: vi.fn().mockReturnValue(mockFileObj),
    } as unknown as JSZip);
    vi.stubGlobal('atob', vi.fn().mockReturnValue('binary'));

    await expect(decodePathBData('dGVzdA==')).rejects.toThrow(
      'Certificate data is not valid JSON',
    );
  });
});

// ── fetchPathCData ────────────────────────────────────────────────────────

describe('fetchPathCData', () => {
  it('returns a parsed SignedVC on success', async () => {
    vi.mocked(certificateApi.getCertificateDetails).mockResolvedValue({
      _osSignedData: JSON.stringify(mockVC),
    });

    const result = await fetchPathCData('cert-123');

    expect(certificateApi.getCertificateDetails).toHaveBeenCalledWith('cert-123');
    expect(result).toEqual(mockVC);
  });

  it('throws a descriptive error if _osSignedData is not valid JSON', async () => {
    vi.mocked(certificateApi.getCertificateDetails).mockResolvedValue({
      _osSignedData: 'not-valid-json{',
    });

    await expect(fetchPathCData('cert-123')).rejects.toThrow(
      'Certificate registry returned invalid data',
    );
  });

  it('propagates API errors from getCertificateDetails', async () => {
    vi.mocked(certificateApi.getCertificateDetails).mockRejectedValue(
      new Error('404 Not Found'),
    );

    await expect(fetchPathCData('missing-cert')).rejects.toThrow('404 Not Found');
  });
});

// ── verifyCertificate ─────────────────────────────────────────────────────

describe('verifyCertificate', () => {
  it('returns verified: true with certificateData on success', async () => {
    mockVerify.mockResolvedValue({ verified: true });

    const result = await verifyCertificate(mockVC);

    expect(result.verified).toBe(true);
    expect(result.certificateData).toEqual({
      issuedTo: 'Jane Doe',
      trainingName: 'Advanced TypeScript',
      issuanceDate: '2024-03-15T00:00:00Z',
    });
  });

  it('returns verified: false with error message when signature fails', async () => {
    mockVerify.mockResolvedValue({
      verified: false,
      error: { message: 'Invalid signature' },
    });

    const result = await verifyCertificate(mockVC);

    expect(result.verified).toBe(false);
    expect(result.error).toBe('Invalid signature');
  });

  it('falls back to default error message when jsigs gives no error.message', async () => {
    mockVerify.mockResolvedValue({ verified: false });

    const result = await verifyCertificate(mockVC);

    expect(result.verified).toBe(false);
    expect(result.error).toBe('Signature verification failed');
  });

  it('returns verified: false when publicKey is missing from issuer', async () => {
    const vcNoKey: SignedVC = {
      ...mockVC,
      issuer: { id: 'https://issuer.example' },
    };

    const result = await verifyCertificate(vcNoKey);

    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/Missing issuer\.publicKey/);
    expect(certificateApi.getPublicKey).not.toHaveBeenCalled();
  });

  it('returns verified: false (never throws) when getPublicKey rejects', async () => {
    vi.mocked(certificateApi.getPublicKey).mockRejectedValue(new Error('Key fetch failed'));

    const result = await verifyCertificate(mockVC);

    expect(result.verified).toBe(false);
    expect(result.error).toBe('Key fetch failed');
  });

  it('handles a string issuer correctly', async () => {
    const vcStringIssuer: SignedVC = {
      ...mockVC,
      issuer: 'https://issuer.example',
    };

    const result = await verifyCertificate(vcStringIssuer);

    // String issuer has no publicKey → should return missing key error
    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/Missing issuer\.publicKey/);
  });

  it('uses first element when publicKey is an array', async () => {
    const vcArrayKey: SignedVC = {
      ...mockVC,
      issuer: { id: 'https://issuer.example', publicKey: ['key-array-0', 'key-array-1'] },
    };
    mockVerify.mockResolvedValue({ verified: true });

    await verifyCertificate(vcArrayKey);

    expect(certificateApi.getPublicKey).toHaveBeenCalledWith('key-array-0');
  });

  it('extracts issuedTo from recipientName when name is absent', async () => {
    const vcRecipient: SignedVC = {
      ...mockVC,
      credentialSubject: { recipientName: 'John Smith', trainingName: 'Course A' },
    };

    const result = await verifyCertificate(vcRecipient);

    expect(result.certificateData?.issuedTo).toBe('John Smith');
  });

  it('extracts trainingName from course.name when top-level field is absent', async () => {
    const vcCourse: SignedVC = {
      ...mockVC,
      credentialSubject: { name: 'Alice', course: { name: 'Intro to React' } },
    };

    const result = await verifyCertificate(vcCourse);

    expect(result.certificateData?.trainingName).toBe('Intro to React');
  });
});
