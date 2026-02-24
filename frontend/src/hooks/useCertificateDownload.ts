import { useState, useEffect, useCallback } from 'react';
import { certificateService } from '@/services/CertificateService';
import { convertSvgToOutput } from '@/utils/svg-converter';
import { useAuth } from '@/auth/AuthContext';

export const useCertificateDownload = () => {
    const { user } = useAuth();
    const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [isLoadingCerts, setIsLoadingCerts] = useState(false);

    // @ts-ignore - The AuthContext user object type might be missing 'sub'
    const userId = user?.sub || user?.id;

    const fetchCertificates = useCallback(async () => {
        if (!userId) return;
        setIsLoadingCerts(true);
        try {
            const searchRes = await certificateService.searchCertificates(userId);

            let certList: any[] = [];
            const data: any = searchRes.data;
            if (Array.isArray(data)) {
                certList = data;
            } else if (data?.result?.Certificate) {
                // Sunbird standard RC search response
                certList = data.result.Certificate;
            } else if (data?.certificates) {
                certList = data.certificates;
            } else if (data && typeof data === 'object') {
                certList = Object.values(data).flat();
            }

            setCertificates(certList);
        } catch (err) {
            console.error('Failed to fetch user certificates:', err);
        } finally {
            setIsLoadingCerts(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const getMatchingCert = (courseId: string, batchId?: string, courseName?: string) => {
        return certificates.find((c: any) =>
            c.training?.osid === courseId ||
            (batchId && c.training?.osid === batchId) ||
            (courseName && c.training?.name === courseName) ||
            c.courseId === courseId ||
            (courseName && c.name === courseName)
        );
    };

    const hasCertificate = useCallback((courseId: string, batchId?: string, courseName?: string) => {
        return !!getMatchingCert(courseId, batchId, courseName);
    }, [certificates]);

    const downloadCertificate = async (courseId: string, batchId: string, courseName: string) => {
        if (!userId) {
            setError('User not found');
            return;
        }

        setDownloadingCourseId(courseId);
        setError(null);

        try {
            const matchingCert = getMatchingCert(courseId, batchId, courseName);

            if (!matchingCert || (!matchingCert.identifier && !matchingCert.id)) {
                throw new Error('Certificate is not yet generated or available for this course.');
            }

            const certId = matchingCert.identifier || matchingCert.id;

            // Download the certificate printUri
            const downloadRes = await certificateService.downloadCertificate(certId);
            const downloadData = downloadRes.data;

            const printUri = downloadData?.result?.printUri || downloadData?.printUri;

            if (!printUri) {
                throw new Error('Failed to retrieve certificate printable data.');
            }

            // Convert SVG to PDF and trigger download
            await convertSvgToOutput(printUri, { fileName: courseName });

        } catch (err: any) {
            console.error('Certificate download error:', err);
            setError(err.message || 'Failed to download certificate');
            // Assuming your app uses a toast library, you might trigger it here
            alert(err.message || 'Failed to download certificate');
        } finally {
            setDownloadingCourseId(null);
        }
    };

    return {
        downloadCertificate,
        hasCertificate,
        downloadingCourseId,
        isLoadingCerts,
        error
    };
};
