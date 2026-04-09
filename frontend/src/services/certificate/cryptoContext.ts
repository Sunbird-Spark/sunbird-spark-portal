import type { JsigsModule, SecurityContextModule, SignedVC } from '@/types/certificateVerification';

// ── W3C Credentials context (bundled to avoid network fetch) ───────────────

const W3C_CREDENTIALS_CONTEXT = Object.freeze({
  '@context': {
    '@version': 1.1,
    id: '@id',
    type: '@type',
    cred: 'https://www.w3.org/2018/credentials#',
    sec: 'https://w3id.org/security#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    VerifiableCredential: 'cred:VerifiableCredential',
    VerifiablePresentation: 'cred:VerifiablePresentation',
    RsaSignature2018: 'sec:RsaSignature2018',
    Ed25519Signature2018: 'sec:Ed25519Signature2018',
    credentialSchema: { '@id': 'cred:credentialSchema', '@type': '@id' },
    credentialStatus: { '@id': 'cred:credentialStatus', '@type': '@id' },
    credentialSubject: { '@id': 'cred:credentialSubject', '@type': '@id' },
    evidence: { '@id': 'cred:evidence', '@type': '@id' },
    expirationDate: { '@id': 'cred:expirationDate', '@type': 'xsd:dateTime' },
    holder: { '@id': 'cred:holder', '@type': '@id' },
    issuanceDate: { '@id': 'cred:issuanceDate', '@type': 'xsd:dateTime' },
    issued: { '@id': 'cred:issued', '@type': 'xsd:dateTime' },
    issuer: { '@id': 'cred:issuer', '@type': '@id' },
    refreshService: { '@id': 'cred:refreshService', '@type': '@id' },
    termsOfUse: { '@id': 'cred:termsOfUse', '@type': '@id' },
    validFrom: { '@id': 'cred:validFrom', '@type': 'xsd:dateTime' },
    validUntil: { '@id': 'cred:validUntil', '@type': 'xsd:dateTime' },
  },
});

// ── Crypto module cache ────────────────────────────────────────────────────

export interface CryptoModules {
  jsigs: JsigsModule;
  baseContexts: Record<string, unknown>;
}

let _cryptoModulesPromise: Promise<CryptoModules> | null = null;

async function loadCryptoModules(): Promise<CryptoModules> {
  const jsigs = (await import('jsonld-signatures')) as JsigsModule;
  const securityContext = (await import('security-context')) as SecurityContextModule;
  const baseContexts: Record<string, unknown> = {
    'https://www.w3.org/2018/credentials/v1': W3C_CREDENTIALS_CONTEXT,
  };
  for (const [url, ctx] of securityContext.contexts) {
    baseContexts[url] = ctx;
  }
  return { jsigs, baseContexts };
}

/**
 * Returns a cached Promise for crypto modules.
 * Concurrent callers before first resolution share the same Promise,
 * preventing duplicate module initialization.
 */
export function getCryptoModules(): Promise<CryptoModules> {
  _cryptoModulesPromise ??= loadCryptoModules().catch((err: unknown) => {
    _cryptoModulesPromise = null; // allow retry on transient failure
    throw err;
  });
  return _cryptoModulesPromise;
}

// ── Context pre-fetch ──────────────────────────────────────────────────────

/**
 * Fetches any JSON-LD context URLs in the VC that are not already in staticContexts.
 * Failures are silently ignored — jsonld-signatures may still verify with bundled contexts.
 */
export async function prefetchContexts(
  vc: SignedVC,
  staticContexts: Record<string, unknown>,
): Promise<void> {
  const contexts = Array.isArray(vc['@context']) ? vc['@context'] : [vc['@context']];
  await Promise.all(
    contexts.map(async (url) => {
      if (typeof url !== 'string' || staticContexts[url]) return;
      try {
        const res = await fetch(url);
        if (res.ok) {
          staticContexts[url] = await res.json();
        }
      } catch {
        // Intentionally ignored — see JSDoc above
      }
    }),
  );
}

// ── Document loader ────────────────────────────────────────────────────────

export function buildDocumentLoader(staticContexts: Record<string, unknown>) {
  return (url: string): { contextUrl: null; documentUrl: string; document: unknown } => {
    const document = staticContexts[url];
    if (document !== undefined) {
      return { contextUrl: null, documentUrl: url, document };
    }
    throw new Error(`Document not available for URL: ${url}`);
  };
}
