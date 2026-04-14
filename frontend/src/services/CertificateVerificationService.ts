import JSZip from 'jszip';
import { getCertificateDetails, getPublicKey } from '@/api/certificateApi';
import {
  getCryptoModules,
  prefetchContexts,
  buildDocumentLoader,
} from '@/services/certificate/cryptoContext';
import type {
  CertificateData,
  VerificationResult,
  SignedVC,
} from '@/types/certificateVerification';

export type { CertificateData, VerificationResult, SignedVC };

// Input size limits — guard against zip bombs from malicious QR payloads
const MAX_BASE64_LENGTH = 50_000;  // ~37 KB compressed
const MAX_JSON_LENGTH = 500_000;   // 500 KB decompressed

// ── Helpers ────────────────────────────────────────────────────────────────

function extractCertificateData(vc: SignedVC): CertificateData {
  const subject = vc.credentialSubject ?? {};
  const issuedTo =
    (subject['name'] as string | undefined) ??
    (subject['recipientName'] as string | undefined) ??
    '';

  const course = subject['course'] as { name?: string } | undefined;
  const training = subject['training'] as { name?: string } | undefined;
  const badge = subject['badge'] as { name?: string } | undefined;
  const trainingName =
    (subject['trainingName'] as string | undefined) ??
    course?.name ??
    training?.name ??
    badge?.name ??
    '';

  return { issuedTo, trainingName, issuanceDate: vc.issuanceDate ?? '' };
}

// ── Path B: decode base64-zipped credential ────────────────────────────────

export async function decodePathBData(dataParam: string): Promise<SignedVC> {
  if (dataParam.length > MAX_BASE64_LENGTH) throw new Error('Certificate data too large');

  // Normalize URL-safe base64 (QR codes use - and _ instead of + and /)
  const normalized = dataParam.replace(/-/g, '+').replace(/_/g, '/');
  const binaryStr = atob(normalized);
  const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
  const zip = await JSZip.loadAsync(bytes);
  const certFile = zip.file('certificate.json');
  if (!certFile) throw new Error('certificate.json not found in ZIP');
  const json = await certFile.async('string');
  if (json.length > MAX_JSON_LENGTH) throw new Error('Certificate data too large');
  try {
    return JSON.parse(json) as SignedVC;
  } catch {
    throw new Error('Certificate data is not valid JSON');
  }
}

// ── Path C: fetch signed VC from registry ─────────────────────────────────

export async function fetchPathCData(certificateId: string): Promise<SignedVC> {
  const details = await getCertificateDetails(certificateId);
  try {
    const vc = JSON.parse(details._osSignedData) as SignedVC;
    return vc;
  } catch {
    throw new Error('Certificate registry returned invalid data');
  }
}

// ── Main verify function ───────────────────────────────────────────────────

export async function verifyCertificate(signedVC: SignedVC, extraTrustedOrigins?: string[]): Promise<VerificationResult> {
  try {
    const { jsigs, baseContexts } = await getCryptoModules();
    const { RsaSignature2018 } = jsigs.suites;
    const { AssertionProofPurpose } = jsigs.purposes;

    // Per-call shallow copy so baseContexts are never mutated across calls
    const staticContexts: Record<string, unknown> = { ...baseContexts };

    await prefetchContexts(signedVC, staticContexts, extraTrustedOrigins);

    const issuer = signedVC.issuer;
    const issuerId = typeof issuer === 'string' ? issuer : (issuer.id ?? '');
    const publicKeyField = typeof issuer === 'string' ? undefined : issuer.publicKey;
    const osid = Array.isArray(publicKeyField)
      ? (publicKeyField[0] ?? '')
      : (publicKeyField ?? '');

    if (!issuerId) {
      return { verified: false, error: 'Missing issuer identifier in certificate' };
    }

    if (!osid) {
      return { verified: false, error: 'Missing issuer.publicKey in certificate' };
    }

    const { value: publicKeyPem } = await getPublicKey(osid);

    // proof is required in SignedVC — no optional chain needed
    const verificationMethod = signedVC.proof.verificationMethod ?? osid;

    // jsigs@5.x expects an LDKeyPair-like object with a publicNode() method
    const keyNode = {
      '@context': jsigs.SECURITY_CONTEXT_URL,
      id: verificationMethod,
      type: 'RsaVerificationKey2018',
      controller: issuerId,
      publicKeyPem,
    };
    const keyDoc: Record<string, unknown> = { ...keyNode, publicNode: () => keyNode };
    const controllerDoc: Record<string, unknown> = {
      '@context': jsigs.SECURITY_CONTEXT_URL,
      id: issuerId,
      publicKey: [keyDoc],
      assertionMethod: [verificationMethod],
    };

    staticContexts[verificationMethod] = keyDoc;
    staticContexts[issuerId] = controllerDoc;

    const suite = new RsaSignature2018({ key: keyDoc });
    const purpose = new AssertionProofPurpose({ controller: controllerDoc });
    const documentLoader = buildDocumentLoader(staticContexts);

    const result = await jsigs.verify(signedVC, {
      suite,
      purpose,
      documentLoader,
      compactProof: false,
    });

    if (result.verified) {
      return { verified: true, certificateData: extractCertificateData(signedVC) };
    }

    return {
      verified: false,
      error: result.error?.message ?? 'Signature verification failed',
    };
  } catch (err) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : 'Certificate verification failed',
    };
  }
}
