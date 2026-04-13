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
 * Only URLs from trusted W3C context domains or the provided extra origins are fetched.
 * Failures are silently ignored — jsonld-signatures may still verify with bundled contexts.
 *
 * @param vc - The signed verifiable credential
 * @param staticContexts - Map of known contexts (will be mutated with fetched contexts)
 * @param extraTrustedOrigins - Additional trusted origins (e.g., Azure blob storage) from system settings
 */
export async function prefetchContexts(
  vc: SignedVC,
  staticContexts: Record<string, unknown>,
  extraTrustedOrigins?: string[],
): Promise<void> {
  // W3C and schema.org are always trusted (standards bodies)
  const alwaysTrustedOrigins = new Set(['https://www.w3.org', 'https://w3id.org', 'https://schema.org']);

  // Add extra trusted origins from system settings if provided
  if (extraTrustedOrigins && extraTrustedOrigins.length > 0) {
    for (const origin of extraTrustedOrigins) {
      try {
        const { origin: parsedOrigin } = new URL(origin);
        alwaysTrustedOrigins.add(parsedOrigin);
      } catch {
        // Ignore invalid URLs
      }
    }
  }

  function isTrustedContextUrl(url: string): boolean {
    try {
      const { protocol, origin } = new URL(url);
      return protocol === 'https:' && alwaysTrustedOrigins.has(origin);
    } catch {
      return false;
    }
  }

  const contexts = Array.isArray(vc['@context']) ? vc['@context'] : [vc['@context']];
  await Promise.all(
    contexts.map(async (url) => {
      if (typeof url !== 'string' || staticContexts[url]) return;
      if (!isTrustedContextUrl(url)) {
        return;
      }
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          staticContexts[url] = json;
        }
      } catch {
        // Silently ignore fetch errors — jsonld-signatures may still verify with bundled contexts
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
