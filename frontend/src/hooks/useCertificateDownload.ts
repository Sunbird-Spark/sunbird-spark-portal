import { useState } from 'react';
import { convertSvgToOutput } from '@/utils/svg-converter';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { IssuedCertificate } from '@/types/TrackableCollections';
import { head } from 'lodash';
import { certificateService } from '@/services/CertificateService';

export const useCertificateDownload = () => {
    const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getMatchingCert = (_courseId: string, _batchId?: string, _courseName?: string, issuedCertificates?: IssuedCertificate[]) => {
        if (issuedCertificates?.length) return head(issuedCertificates);
        return undefined;
    };

    const hasCertificate = (_courseId: string, _batchId?: string, _courseName?: string, issuedCertificates?: IssuedCertificate[]) => {
        return !!getMatchingCert(_courseId, _batchId, _courseName, issuedCertificates);
    };

    const downloadCertificate = async (courseId: string, batchId: string, courseName: string, issuedCertificates?: IssuedCertificate[], _completedOn?: number) => {
        let userId = userAuthInfoService.getUserId();
        if (!userId) {
            const authInfo = await userAuthInfoService.getAuthInfo();
            userId = authInfo?.uid ?? null;
        }

        if (!userId) {
            setError('User not found');
            return;
        }

        setDownloadingCourseId(courseId);
        setError(null);

        try {
            // Step 1: Get certificate ID and template URL from issued certificates
            const matchingCert = getMatchingCert(courseId, batchId, courseName, issuedCertificates);
            let certId = matchingCert?.identifier || matchingCert?.token;
            let templateUrl = matchingCert?.templateUrl;

            // Step 2: If no ID in enrollment data, search RC registry
            if (!certId && userId) {
                const searchResponse = await certificateService.searchCertificates(userId);
                const certs = Array.isArray(searchResponse.data) ? searchResponse.data : [];
                const rcCert = certs.find(
                    (c: Record<string, unknown>) => (c.training as Record<string, unknown>)?.id === courseId && (!batchId || (c.training as Record<string, unknown>)?.batchId === batchId)
                );
                certId = (rcCert as any)?.osid ?? (rcCert as any)?.identifier;
            }

            if (!certId) {
                throw new Error('Certificate is not yet generated or available for this course.');
            }

            // Step 3: Download processed certificate SVG from API
            // Pass template URL in header (required by RC service)
            const response = await certificateService.downloadCertificate(certId, templateUrl);
            const svgContent = response.data;

            if (!svgContent || typeof svgContent !== 'string' || svgContent.trim().length === 0) {
                throw new Error('No certificate SVG received from server.');
            }

            // Step 4: Convert SVG → PDF and trigger download
            await convertSvgToOutput(svgContent, { fileName: courseName || 'certificate' });

        } catch (err: unknown) {
            console.error('Certificate download error:', err);
            const errorMessage = (err instanceof Error ? err.message : String(err)) || 'Failed to download certificate';
            setError(errorMessage);
        } finally {
            setDownloadingCourseId(null);
        }
    };

    return {
        downloadCertificate,
        hasCertificate,
        downloadingCourseId,
        isLoadingCerts: false,
        error
    };
};
