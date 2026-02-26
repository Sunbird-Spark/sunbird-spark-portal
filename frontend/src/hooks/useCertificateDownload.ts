import { useState } from 'react';
import { convertSvgToOutput } from '@/utils/svg-converter';
import { IssuedCertificate } from '@/types/TrackableCollections';
import { toast } from '@/hooks/useToast';
import { head } from 'lodash';

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
        setDownloadingCourseId(courseId);
        setError(null);

        try {
            const matchingCert = getMatchingCert(courseId, batchId, courseName, issuedCertificates);

            if (!matchingCert) {
                throw new Error('Certificate is not yet generated or available for this course.');
            }

            const certId = matchingCert.identifier || matchingCert.token;
            if (!certId) {
                throw new Error('Certificate ID is missing.');
            }

            // Fetch certificate metadata using native fetch
            const response = await fetch(`/portal/rc/certificate/v1/download/${certId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch certificate: ${response.statusText}`);
            }

            const certificateData = await response.json();
            const svgUrl = certificateData?.templateUrl;
            
            if (!svgUrl) {
                throw new Error('Certificate template URL not found.');
            }

            // Fetch SVG from the template URL
            const svgResponse = await fetch(svgUrl);
            if (!svgResponse.ok) {
                throw new Error(`Failed to fetch certificate SVG: ${svgResponse.statusText}`);
            }

            const svgContent = await svgResponse.text();
            if (!svgContent) {
                throw new Error('Empty certificate SVG received.');
            }

            // Convert SVG to PDF and download
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
