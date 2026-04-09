import { buildDocumentLoader, getCryptoModules, prefetchContexts } from './cryptoContext';

// ── Mock dynamic imports ───────────────────────────────────────────────────
// security-context exports `contexts` as a top-level named export (not under default)

const SECURITY_URL = 'https://w3id.org/security/v2';

vi.mock('jsonld-signatures', () => ({
  verify: vi.fn(),
  suites: { RsaSignature2018: vi.fn() },
  purposes: { AssertionProofPurpose: vi.fn() },
  SECURITY_CONTEXT_URL: 'https://w3id.org/security/v2',
}));

vi.mock('security-context', () => ({
  contexts: new Map<string, unknown>([[SECURITY_URL, { '@context': 'security' }]]),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// ── buildDocumentLoader ───────────────────────────────────────────────────

describe('buildDocumentLoader', () => {
  it('returns the document for a known URL', () => {
    const doc = { '@context': 'test' };
    const loader = buildDocumentLoader({ 'https://example.com/ctx': doc });

    const result = loader('https://example.com/ctx');

    expect(result).toEqual({
      contextUrl: null,
      documentUrl: 'https://example.com/ctx',
      document: doc,
    });
  });

  it('throws a descriptive error for an unknown URL', () => {
    const loader = buildDocumentLoader({});

    expect(() => loader('https://unknown.example/ctx')).toThrow(
      'Document not available for URL: https://unknown.example/ctx',
    );
  });

  it('distinguishes between multiple entries', () => {
    const docA = { id: 'a' };
    const docB = { id: 'b' };
    const loader = buildDocumentLoader({
      'https://example.com/a': docA,
      'https://example.com/b': docB,
    });

    expect(loader('https://example.com/a').document).toBe(docA);
    expect(loader('https://example.com/b').document).toBe(docB);
  });
});

// ── prefetchContexts ──────────────────────────────────────────────────────

describe('prefetchContexts', () => {
  const TRUSTED_URL = 'https://w3id.org/security/v2';
  const UNTRUSTED_URL = 'https://attacker.example/ctx';

  const mockVC = {
    '@context': ['https://www.w3.org/2018/credentials/v1', TRUSTED_URL],
  } as Parameters<typeof prefetchContexts>[0];

  it('skips URLs already present in staticContexts', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await prefetchContexts(
      { ...mockVC, '@context': 'https://www.w3.org/2018/credentials/v1' },
      { 'https://www.w3.org/2018/credentials/v1': {} },
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches and stores unknown context URLs from trusted domains', async () => {
    const fetchedCtx = { '@context': 'new' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fetchedCtx),
    } as Response);

    const staticContexts: Record<string, unknown> = {};
    await prefetchContexts(mockVC, staticContexts);

    expect(staticContexts[TRUSTED_URL]).toEqual(fetchedCtx);
  });

  it('never fetches URLs from untrusted domains', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const staticContexts: Record<string, unknown> = {};
    await prefetchContexts(
      { ...mockVC, '@context': UNTRUSTED_URL },
      staticContexts,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(staticContexts[UNTRUSTED_URL]).toBeUndefined();
  });

  it('silently ignores fetch failures on trusted domains', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const staticContexts: Record<string, unknown> = {};
    await expect(prefetchContexts(mockVC, staticContexts)).resolves.not.toThrow();
    expect(staticContexts[TRUSTED_URL]).toBeUndefined();
  });

  it('skips non-string context entries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const vcWithObjectCtx = {
      '@context': [{ '@version': 1.1 }],
    } as unknown as Parameters<typeof prefetchContexts>[0];

    await prefetchContexts(vcWithObjectCtx, {});

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('handles a single string @context (not array)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const staticContexts: Record<string, unknown> = {};
    await prefetchContexts(
      { ...mockVC, '@context': TRUSTED_URL },
      staticContexts,
    );

    expect(staticContexts[TRUSTED_URL]).toBeDefined();
  });
});

// ── getCryptoModules ──────────────────────────────────────────────────────

describe('getCryptoModules', () => {
  it('returns an object with jsigs and baseContexts', async () => {
    const result = await getCryptoModules();

    expect(result.jsigs).toBeDefined();
    expect(result.baseContexts).toBeDefined();
  });

  it('includes the W3C credentials URL in baseContexts', async () => {
    const { baseContexts } = await getCryptoModules();

    expect(baseContexts['https://www.w3.org/2018/credentials/v1']).toBeDefined();
  });

  it('includes security context URLs in baseContexts', async () => {
    const { baseContexts } = await getCryptoModules();

    expect(baseContexts[SECURITY_URL]).toBeDefined();
  });

  it('concurrent calls return the same Promise (no duplicate init)', () => {
    const p1 = getCryptoModules();
    const p2 = getCryptoModules();

    expect(p1).toBe(p2);
  });
});
