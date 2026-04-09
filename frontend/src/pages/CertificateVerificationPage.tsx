import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAppI18n } from '@/hooks/useAppI18n';
import {
  decodePathBData,
  fetchPathCData,
  verifyCertificate,
  type CertificateData,
} from '@/services/CertificateVerificationService';

type VerificationStatus = 'verifying' | 'verified' | 'failed';

// ── Shared label style ────────────────────────────────────────────────────

const LABEL_CLS = 'text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1';

// ── Sub-components ────────────────────────────────────────────────────────

function VerifiedBadgeIcon() {
  return (
    <svg
      className="w-6 h-6 text-gray-800"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1l2.753 3.978 4.8-1.259-1.26 4.8L22 12l-3.707 3.481 1.26 4.8-4.8-1.26L12 23l-2.753-3.979-4.8 1.26 1.26-4.8L2 12l3.707-3.481-1.26-4.8 4.8 1.26L12 1z" />
      <path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function SmallCheckIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6l2.5 2.5 4.5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 2l8 8M10 2l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const CertificateVerificationPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useAppI18n();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!certificateId) {
      setStatus('failed');
      return;
    }

    const dataParam = searchParams.get('data');

    const run = async () => {
      try {
        const signedVC = dataParam
          ? await decodePathBData(dataParam)
          : await fetchPathCData(certificateId);

        const result = await verifyCertificate(signedVC);

        if (result.verified && result.certificateData) {
          setCertificate(result.certificateData);
          setStatus('verified');
        } else {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    };

    run();
  }, [certificateId, searchParams]);

  // ── Verifying ─────────────────────────────────────────────────────────

  if (status === 'verifying') {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-stone-50"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-full border-4 border-sunbird-brick border-t-transparent animate-spin" />
          <p className="font-rubik text-sm font-medium text-gray-500 tracking-wide">
            {t('certificate.verifying')}
          </p>
        </div>
      </div>
    );
  }

  // ── Verified ──────────────────────────────────────────────────────────

  if (status === 'verified' && certificate) {
    const formattedDate = certificate.issuanceDate
      ? new Date(certificate.issuanceDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';

    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-sm">
          {/* Icon + title */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-100 rounded-2xl p-3 mb-4 shadow-sm">
              <VerifiedBadgeIcon />
            </div>
            <h1 className="font-rubik text-2xl font-bold text-gray-900">
              {t('certificate.verified')}
            </h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Status header */}
            <div className="bg-green-50 px-6 py-3 flex items-center justify-between">
              <span className={LABEL_CLS}>{t('certificate.status')}</span>
              <span className="inline-flex items-center gap-1.5 bg-sunbird-moss text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
                <SmallCheckIcon />
                {t('certificate.activeAndValid')}
              </span>
            </div>

            {/* Data rows */}
            <div className="px-6">
              <div className="py-5">
                <p className={LABEL_CLS}>{t('certificate.credentialHolder')}</p>
                <p className="font-rubik text-lg font-semibold text-gray-900 leading-tight">
                  {certificate.issuedTo}
                </p>
              </div>

              <hr className="border-gray-100" />

              <div className="py-5">
                <p className={LABEL_CLS}>{t('certificate.certificationProgram')}</p>
                <p className="font-rubik text-lg font-semibold text-sunbird-brick leading-tight">
                  {certificate.trainingName}
                </p>
              </div>

              <hr className="border-gray-100" />

              <div className="py-5 text-center">
                <p className={LABEL_CLS}>{t('certificate.issuedOn')}</p>
                <p className="font-rubik text-base font-semibold text-gray-900">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Bottom accent */}
            <div className="h-1 bg-sunbird-brick" />
          </div>
        </div>
      </div>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-sm">
        {/* Icon + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-100 rounded-2xl p-3 mb-4 shadow-sm">
            <svg
              className="w-6 h-6 text-red-700"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1l2.753 3.978 4.8-1.259-1.26 4.8L22 12l-3.707 3.481 1.26 4.8-4.8-1.26L12 23l-2.753-3.979-4.8 1.26 1.26-4.8L2 12l3.707-3.481-1.26-4.8 4.8 1.26L12 1z" />
              <path
                d="M9 9l6 6M15 9l-6 6"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="font-rubik text-2xl font-bold text-gray-900">
            {t('certificate.verificationFailed')}
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Status header */}
          <div className="bg-red-50 px-6 py-3 flex items-center justify-between">
            <span className={LABEL_CLS}>{t('certificate.status')}</span>
            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
              <XIcon />
              {t('certificate.invalid')}
            </span>
          </div>

          {/* Generic error message — never expose internal details */}
          <div className="px-6 py-6 text-center">
            <p className="font-rubik text-sm text-gray-500 leading-relaxed">
              {t('certificate.couldNotVerify')}
            </p>
          </div>

          <div className="px-6 pb-6">
            <Link
              to="/"
              className="block w-full text-center font-rubik bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {t('certificate.backToHome')}
            </Link>
          </div>

          {/* Bottom accent */}
          <div className="h-1 bg-sunbird-brick" />
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
