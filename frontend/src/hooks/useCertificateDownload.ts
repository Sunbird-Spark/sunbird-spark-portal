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

            const certId = 'osid' in matchingCert ? matchingCert.osid : matchingCert.identifier || matchingCert.token;

            if (!certId) {
                throw new Error('Certificate ID is missing, cannot download from service.');
            }

            const { data } = await certificateService.downloadCertificate(certId);
            let dataObj = data;

            if (typeof dataObj === 'string' && !dataObj.includes('<svg')) {
                try { dataObj = JSON.parse(dataObj); } catch { /* ignore */ }
            }
            if (isArray(dataObj)) dataObj = head(dataObj) || {};

            const svgString = await extractSvgString(dataObj, data, matchingCert, courseName);
            await convertSvgToOutput(svgString, { fileName: courseName });

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

    const extractSvgString = async (dataObj: any, rawData: any, matchingCert: any, courseName: string): Promise<string> => {
        if (typeof rawData === 'string' && rawData.includes('<svg')) return rawData;

        const printUri = get(dataObj, 'result.printUri') || get(dataObj, 'printUri');
        if (printUri) {
            if (printUri.startsWith('http')) {
                const response = await fetch(printUri);
                if (!response.ok) throw new Error(`Failed to fetch SVG: ${response.statusText}`);
                return response.text();
            }
            return printUri;
        }

        const templateUrl = get(dataObj, 'templateUrl') || get(matchingCert, 'templateUrl');
        if (templateUrl && get(dataObj, '_osSignedData')) {
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`Failed to fetch template: ${response.statusText}`);
            let template = await response.text();

            try {
                const signedData = JSON.parse(dataObj._osSignedData);
                const subject = get(signedData, 'credentialSubject', {});
                const issuanceDate = new Date(get(signedData, 'issuanceDate') || get(dataObj, 'osCreatedAt'));
                const formattedDate = issuanceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

                template = template
                    .replace(/\{\{\s*credentialSubject\.recipientName\s*\}\}/g, get(subject, 'recipientName', ''))
                    .replace(/\{\{\s*credentialSubject\.trainingName\s*\}\}/g, get(subject, 'trainingName', courseName || ''))
                    .replace(/\{\{\s*dateFormat\s+issuanceDate[^}]*\}\}/g, formattedDate)
                    .replace(/\{\{\s*(qrCode|minFontSize|maxFontSize)\s*\}\}/g, '');
            } catch (e) {
                console.error('Failed to parse credential data', e);
            }
            return template;
        }

        throw new Error('Failed to retrieve certificate data.');
    };

    return {
        downloadCertificate,
        hasCertificate,
        downloadingCourseId,
        isLoadingCerts,
        error
    };
};
