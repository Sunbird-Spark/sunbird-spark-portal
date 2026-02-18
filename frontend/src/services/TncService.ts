import { getClient, ApiResponse } from '../lib/http-client';

export interface AcceptTncRequest {
    version: string;
    identifier: string;
}

export interface AcceptTncResponse {
    success: boolean;
}

export class TncService {
    getTncUrl(tncConfig: any): string {
        const value = tncConfig?.data?.response?.value;

        if (!value) return '';

        let parsedValue = value;
        if (typeof value === 'string') {
            try {
                parsedValue = JSON.parse(value);
            } catch (e) {
                console.error('Failed to parse TNC config:', e);
                return '';
            }
        }

        const latestVersion = parsedValue.latestVersion;

        if (latestVersion && parsedValue[latestVersion]?.url) {
            return parsedValue[latestVersion].url;
        }

        return '';
    }

    getLatestVersion(tncConfig: any): string {
        const value = tncConfig?.data?.response?.value;

        if (!value) return '';

        let parsedValue = value;
        if (typeof value === 'string') {
            try {
                parsedValue = JSON.parse(value);
            } catch (e) {
                console.error('Failed to parse TNC config:', e);
                return '';
            }
        }

        return parsedValue?.latestVersion || '';
    }

    async acceptTnc(tncConfig: any, identifier: string): Promise<ApiResponse<AcceptTncResponse>> {
        const version = this.getLatestVersion(tncConfig);

        return getClient().post<AcceptTncResponse>('/user/v1/tnc/accept', {
            version,
            identifier,
        });
    }
}