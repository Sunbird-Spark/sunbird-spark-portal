export interface CertificateData {
  issuedTo: string;
  trainingName: string;
  issuanceDate: string;
}

export interface VerificationResult {
  verified: boolean;
  certificateData?: CertificateData;
  error?: string;
}

// W3C Verifiable Credential shape (Sunbird subset)
export interface SignedVC {
  '@context': string | string[];
  type: string | string[];
  issuanceDate: string;
  issuer:
    | string
    | {
        id?: string;
        publicKey?: string | string[];
        [key: string]: unknown;
      };
  credentialSubject: {
    name?: string;
    recipientName?: string;
    trainingName?: string;
    course?: { name?: string };
    training?: { name?: string };
    badge?: { name?: string };
    [key: string]: unknown;
  };
  proof: {
    type: string;
    verificationMethod: string;
    jws?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Dynamic import interfaces for JS-only packages (declared in src/types/vendor.d.ts)
export interface JsigsModule {
  verify: (
    doc: unknown,
    opts: unknown,
  ) => Promise<{ verified: boolean; error?: { message?: string } }>;
  suites: { RsaSignature2018: new (opts: unknown) => unknown };
  purposes: { AssertionProofPurpose: new (opts: unknown) => unknown };
  SECURITY_CONTEXT_URL: string;
}

export interface SecurityContextModule {
  contexts: Map<string, unknown>;
}
