import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { split } from 'lodash';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import PageLoader from '@/components/common/PageLoader';
import Header from '@/components/home/Header';
import {
  decodePathBData,
  fetchPathCData,
  verifyCertificate,
  type CertificateData,
} from '@/services/CertificateVerificationService';
import {
  VerifiedBadgeIcon,
  SmallCheckIcon,
  XIcon,
  FailedBadgeIcon,
} from './CertificateVerificationIcons';

type VerificationStatus = 'verifying' | 'verified' | 'failed';

// ── Shared label style ────────────────────────────────────────────────────

const LABEL_CLS = 'text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1';

// ── Page ──────────────────────────────────────────────────────────────────

const CertificateVerificationPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useAppI18n();
  const { data: certContextSetting, isLoading: isSettingLoading } = useSystemSetting('certContextOrigins');

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!certificateId) {
      setStatus('failed');
      return;
    }

    // Wait only for the system setting query to finish loading.
    // Extra trusted origins are optional, so continue with an empty list
    // when the setting is absent or does not contain a value.
    if (isSettingLoading) {
      return;
    }

    let cancelled = false;
    const dataParam = searchParams.get('data');

    const run = async () => {
      try {
        // Extract and parse trusted context origins from system settings
        // Hook response structure: { data: { response: { value } }, status, headers }
        // Value can be: single URL or comma-separated URLs
        // e.g., "https://url1.com" or "https://url1.com,https://url2.com,https://url3.com"
        const rawValue = certContextSetting?.data?.response?.value;
        let extraTrustedOrigins: string[] = [];
        if (rawValue) {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(rawValue) as string;
            // Split by comma and process each URL
            const urls = split(parsed, ',').map(url => url.trim()).filter(Boolean);
            for (const urlStr of urls) {
              try {
                // Extract origin (protocol + domain) from each URL
                const urlObj = new URL(urlStr);
                extraTrustedOrigins.push(urlObj.origin);
              } catch {
                // Skip invalid URLs
              }
            }
          } catch {
            // If JSON parsing fails, try regex extraction for comma-separated URLs
            const urlMatches = rawValue.match(/https?:\/\/[^,}]+/g);
            if (urlMatches) {
              for (const urlStr of urlMatches) {
                try {
                  const urlObj = new URL(urlStr.trim());
                  extraTrustedOrigins.push(urlObj.origin);
                } catch {
                  // Skip invalid URLs
                }
              }
            }
          }
        }

        const signedVC = dataParam
          ? await decodePathBData(dataParam)
          : await fetchPathCData(certificateId);

        const result = await verifyCertificate(signedVC, extraTrustedOrigins);

        if (cancelled) return;

        if (result.verified && result.certificateData) {
          setCertificate(result.certificateData);
          setStatus('verified');
        } else {
          if (!cancelled) setStatus('failed');
        }
      } catch {
        if (!cancelled) setStatus('failed');
      }
    };

    run();
    return () => { cancelled = true; };
  }, [certificateId, searchParams, isSettingLoading, certContextSetting]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header forcePublic />

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Verifying state */}
        {status === 'verifying' && (
          <PageLoader message={t('certificate.verifying')} fullPage={false} />
        )}

        {/* Verified state */}
        {status === 'verified' && certificate && (() => {
          const formattedDate = certificate.issuanceDate
            ? new Date(certificate.issuanceDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '—';

          return (
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
          );
        })()}

        {/* Failed state */}
        {status === 'failed' && (
          <div className="w-full max-w-sm">
        {/* Icon + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-red-100 rounded-2xl p-3 mb-4 shadow-sm">
            <FailedBadgeIcon />
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
        )}
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
