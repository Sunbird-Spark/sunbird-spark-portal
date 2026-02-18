import _ from 'lodash';
import { getClient, ApiResponse } from '../lib/http-client';

export interface AcceptTncRequest {
    version: string;
    identifier: string;
}

export interface AcceptTncResponse {
    success: boolean;
}

export class TncService {
    private parseTncConfig(tncConfig: any): any {
        const value = _.get(tncConfig, 'data.response.value');
        if (!value) return null;
        if (!_.isString(value)) return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error('Failed to parse TNC config:', e);
            return null;
        }
    }

    getTncUrl(tncConfig: any): string {
        const parsed = this.parseTncConfig(tncConfig);
        const latestVersion = _.get(parsed, 'latestVersion');
        return _.get(parsed, [latestVersion, 'url'], '');
    }

    getLatestVersion(tncConfig: any): string {
        return _.get(this.parseTncConfig(tncConfig), 'latestVersion', '');
    }

    async acceptTnc(tncConfig: any, identifier: string): Promise<ApiResponse<AcceptTncResponse>> {
        const version = this.getLatestVersion(tncConfig);

        return getClient().post<AcceptTncResponse>('/user/v1/tnc/accept', {
            version,
            identifier,
        });
    }
}