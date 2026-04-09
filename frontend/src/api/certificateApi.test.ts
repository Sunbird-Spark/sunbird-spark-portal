import * as httpClient from '@/lib/http-client';
import { getCertificateDetails, getPublicKey } from './certificateApi';

const mockGet = vi.fn();

vi.spyOn(httpClient, 'getClient').mockReturnValue({
  get: mockGet,
} as unknown as ReturnType<typeof httpClient.getClient>);

afterEach(() => {
  vi.clearAllMocks();
});

// ── getCertificateDetails ─────────────────────────────────────────────────

describe('getCertificateDetails', () => {
  it('returns _osSignedData on success', async () => {
    mockGet.mockResolvedValue({ data: { _osSignedData: '{"type":"VerifiableCredential"}' } });

    const result = await getCertificateDetails('cert-123');

    expect(mockGet).toHaveBeenCalledWith('/rc/certificate/v1/download/cert-123');
    expect(result._osSignedData).toBe('{"type":"VerifiableCredential"}');
  });

  it('encodes the certificate id in the URL', async () => {
    mockGet.mockResolvedValue({ data: { _osSignedData: '{}' } });

    await getCertificateDetails('abc-def-456');

    expect(mockGet).toHaveBeenCalledWith('/rc/certificate/v1/download/abc-def-456');
  });

  it('propagates API errors', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getCertificateDetails('cert-123')).rejects.toThrow('Network error');
  });
});

// ── getPublicKey ──────────────────────────────────────────────────────────

describe('getPublicKey', () => {
  it('returns public key value on success', async () => {
    mockGet.mockResolvedValue({ data: { value: '-----BEGIN PUBLIC KEY-----\nMIIB...' } });

    const result = await getPublicKey('key-osid-789');

    expect(mockGet).toHaveBeenCalledWith('/rc/certificate/v1/key/key-osid-789');
    expect(result.value).toBe('-----BEGIN PUBLIC KEY-----\nMIIB...');
  });

  it('propagates API errors', async () => {
    mockGet.mockRejectedValue(new Error('Key not found'));

    await expect(getPublicKey('missing-key')).rejects.toThrow('Key not found');
  });
});
