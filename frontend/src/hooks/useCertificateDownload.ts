import { useState, useEffect, useCallback } from 'react';
import { certificateService, Certificate } from '@/services/CertificateService';
import { convertSvgToOutput } from '@/utils/svg-converter';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { IssuedCertificate } from '@/types/TrackableCollections';
import { toast } from '@/hooks/useToast';
import { get, head, isArray } from 'lodash';

export const useCertificateDownload = () => {
    const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoadingCerts, setIsLoadingCerts] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;
        const fetchUserId = async () => {
            try {
                let id = userAuthInfoService.getUserId();
                if (!id) {
                    const authInfo = await userAuthInfoService.getAuthInfo();
                    id = authInfo?.uid ?? null;
                }
                if (!isCancelled) {
                    setUserId(id);
                }
            } catch (err) {
                console.error('Failed to resolve user id for certificate download:', err);
            }
        };
        fetchUserId();
        return () => {
            isCancelled = true;
        };
    }, []);

    const fetchCertificates = useCallback(async () => {
        if (!userId) return;
        setIsLoadingCerts(true);
        try {
            const { data } = await certificateService.searchCertificates(userId);
            const certList = isArray(data) ? data : get(data, 'result.Certificate', []);
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

    const getMatchingCert = (courseId: string, batchId?: string, courseName?: string, issuedCertificates?: IssuedCertificate[]) => {
        if (issuedCertificates?.length) return head(issuedCertificates);
        return certificates.find((c) =>
            c.training.id === courseId ||
            c.training.batchId === batchId ||
            c.training.name === courseName
        );
    };

    const hasCertificate = (courseId: string, batchId?: string, courseName?: string, issuedCertificates?: IssuedCertificate[]) => {
        return !!getMatchingCert(courseId, batchId, courseName, issuedCertificates);
    };

    const downloadCertificate = async (courseId: string, batchId: string, courseName: string, issuedCertificates?: IssuedCertificate[]) => {
        if (!userId) {
            setError('User not found');
            return;
        }

        setDownloadingCourseId(courseId);
        setError(null);

        try {
            const matchingCert = getMatchingCert(courseId, batchId, courseName, issuedCertificates);

            if (!matchingCert) {
                throw new Error('Certificate is not yet generated or available for this course.');
            }

            const certIdValue = 'identifier' in matchingCert ? matchingCert.identifier : matchingCert.osid || matchingCert.token;
            const certId = certIdValue as string;

            if (!certId) {
                throw new Error('Certificate ID is missing.');
            }

            const { data } = await certificateService.downloadCertificate(certId);

            const templateUrl = 'templateUrl' in matchingCert ? matchingCert.templateUrl : undefined;
            if (!templateUrl) {
                throw new Error('Certificate template URL is missing.');
            }

            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`Failed to fetch certificate: ${response.statusText}`);

            const svgString = await response.text();
            await convertSvgToOutput(svgString, { fileName: courseName || 'certificate' });

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
        isLoadingCerts,
        error
    };
};
