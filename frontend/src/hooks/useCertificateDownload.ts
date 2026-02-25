import { useState } from 'react';
import { convertSvgToOutput } from '@/utils/svg-converter';
import { populateSvgTemplate } from '@/utils/svg-template-populator';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { IssuedCertificate } from '@/types/TrackableCollections';
import { toast } from '@/hooks/useToast';
import { head } from 'lodash';
import { UserService } from '@/services/UserService';

const userService = new UserService();

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
            const matchingCert = getMatchingCert(courseId, batchId, courseName, issuedCertificates);

            if (!matchingCert) {
                throw new Error('Certificate is not yet generated or available for this course.');
            }

            const certId = matchingCert.identifier || matchingCert.token;

            if (!certId) {
                throw new Error('Certificate ID is missing.');
            }

            const templateUrl = 'templateUrl' in matchingCert ? matchingCert.templateUrl : undefined;
            if (!templateUrl) {
                throw new Error('Certificate template URL is missing.');
            }

            const userResponse = await userService.userRead(userId);
            const userProfile = userResponse.data.response;
            const userName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
            const completionDate = completedOn ? new Date(completedOn).toISOString() : new Date().toISOString();

            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error(`Failed to fetch certificate: ${response.statusText}`);

            const svgString = await response.text();
            const populatedSvg = populateSvgTemplate(svgString, userName, courseName, completionDate);
            await convertSvgToOutput(populatedSvg, { fileName: courseName || 'certificate' });

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

