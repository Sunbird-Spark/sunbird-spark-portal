import { useState } from 'react';
import { convertSvgToOutput } from '@/utils/svg-converter';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { IssuedCertificate } from '@/types/TrackableCollections';
import { toast } from '@/hooks/useToast';
import { head } from 'lodash';
import { certificateService } from '@/services/CertificateService';

export const useCertificateDownload = () => {
    const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getMatchingCert = (courseId: string, batchId?: string, courseName?: string, issuedCertificates?: IssuedCertificate[]) => {
        if (issuedCertificates?.length) return head(issuedCertificates);
        return undefined;
    };

    const hasCertificate = (courseId: string, batchId?: string, courseName?: string, issuedCertificates?: IssuedCertificate[]) => {
        return !!getMatchingCert(courseId, batchId, courseName, issuedCertificates);
    };

    const downloadCertificate = async (courseId: string, batchId: string, courseName: string, issuedCertificates?: IssuedCertificate[], completedOn?: number) => {
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
            // Step 1: Get certificate ID from issued certificates
            const matchingCert = getMatchingCert(courseId, batchId, courseName, issuedCertificates);
            let certId = matchingCert?.identifier || matchingCert?.token;

            // Step 2: If no ID in enrollment data, search RC registry
            if (!certId && userId) {
                const searchResponse = await certificateService.searchCertificates(userId);
                const certs = Array.isArray(searchResponse.data) ? searchResponse.data : [];
                const rcCert = certs.find(
                    (c: any) => c.training?.id === courseId && (!batchId || c.training?.batchId === batchId)
                );
                certId = rcCert?.osid ?? (rcCert as any)?.identifier;
            }

            if (!certId) {
                throw new Error('Certificate is not yet generated or available for this course.');
            }

            // Step 3: Download fully-populated certificate from RC service
            // Use native fetch for SVG content (http-client is JSON-only by default)
            const downloadUrl = `/portal/rc/certificate/v1/download/${certId}`;
            const response = await fetch(downloadUrl, {
                headers: {
                    'Accept': 'image/svg+xml'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch certificate: ${response.statusText}`);
            }

            const svgContent = await response.text();

            if (!svgContent || svgContent.trim().length === 0) {
                throw new Error('Empty certificate received from server.');
            }

            // Step 4: Convert SVG → PDF and trigger download
            await convertSvgToOutput(svgContent, { fileName: courseName || 'certificate' });

        } catch (err: any) {
            console.error('Certificate download error:', err);
            const errorMessage = err.message || 'Failed to download certificate';
            setError(errorMessage);
            toast({
                title: 'Download Failed',
                description: errorMessage,
                variant: 'destructive'
            });
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

