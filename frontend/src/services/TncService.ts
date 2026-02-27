import _ from 'lodash';
import { getClient, ApiResponse } from '../lib/http-client';

export interface AcceptTncRequest {
    version: string;
    identifier?: string;
    tncType?: string;
}

export interface AcceptTncResponse {
    success: boolean;
}

export class TncService {
    private parseTncConfig(tncConfig: unknown): unknown {
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

    getTncUrl(tncConfig: unknown): string {
        const parsed = this.parseTncConfig(tncConfig);
        const latestVersion = _.get(parsed, 'latestVersion') as unknown as string;
        if (!latestVersion) return '';
        return _.get(parsed, [latestVersion, 'url'], '');
    }

    getLatestVersion(tncConfig: unknown): string {
        return _.get(this.parseTncConfig(tncConfig), 'latestVersion', '');
    }

    async acceptTnc(tncConfig: unknown, identifier?: string, tncType?: string): Promise<ApiResponse<AcceptTncResponse>> {
        const version = this.getLatestVersion(tncConfig);
        const body: Record<string, string> = { version };
        if (identifier) body.identifier = identifier;
        if (tncType) body.tncType = tncType;
        return getClient().post<AcceptTncResponse>('/user/v1/tnc/accept', body);
    }
}