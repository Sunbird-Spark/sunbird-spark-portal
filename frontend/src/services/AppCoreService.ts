import { DeviceService, $t } from '@project-sunbird/telemetry-sdk';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { getClient } from '../lib/http-client';

interface AppInfo {
    appId: string;
    version: string;
    buildHash: string;
}

class AppCoreService {
    private static instance: AppCoreService;
    private deviceId: string | null = null;
    private appInfoCache: AppInfo | null = null;
    private pDataCache: { id: string; ver: string; pid: string } | null = null;

    private constructor() {
        // Private constructor for singleton pattern
    }

    static getInstance(): AppCoreService {
        if (!AppCoreService.instance) {
            AppCoreService.instance = new AppCoreService();
        }
        return AppCoreService.instance;
    }

    private async fetchAppInfo(): Promise<AppInfo> {
        if (this.appInfoCache) return this.appInfoCache;
        const response = await getClient().get<AppInfo>('/app/v1/info');
        this.appInfoCache = response.data ?? { appId: '', version: '', buildHash: '1.0' };
        return this.appInfoCache;
    }

    async getDeviceId(): Promise<string> {
        // Return cached device ID if available
        if (this.deviceId) {
            return this.deviceId;
        }

        // Check localStorage first
        const stored = getStorageItem('deviceId');
        if (stored) {
            this.deviceId = stored;
            return stored;
        }

        // Generate device ID using telemetry SDK
        try {
            const deviceId = await DeviceService.getFingerPrint();
            this.deviceId = deviceId;
            setStorageItem('deviceId', deviceId);
            return deviceId;
        } catch (error) {
            console.error('Failed to generate device ID', error);
            throw error;
        }
    }

    clearDeviceId(): void {
        this.deviceId = null;
        removeStorageItem('deviceId');
    }

    async getDeviceInfo(): Promise<{
        deviceId: string;
        userAgent: string;
        timestamp: number;
        platform: string;
    }> {
        const deviceId = await this.getDeviceId();

        return {
            deviceId,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            platform: navigator.platform,
        };
    }

    hasDeviceId(): boolean {
        return getStorageItem('deviceId') !== null;
    }

    async getBuildHash(): Promise<string> {
        const info = await this.fetchAppInfo();
        return info.buildHash || '1.0';
    }

    async getPData(): Promise<{ id: string; ver: string; pid: string }> {
        if (this.pDataCache) return this.pDataCache;

        const info = await this.fetchAppInfo();

        this.pDataCache = {
            id: info.appId || '',
            ver: info.version || '',
            pid: info.appId || '',
        };

        return this.pDataCache;
    }

    async initialize(): Promise<void> {
        try {
            // Expose global telemetry instance for backward compatibility
            if (typeof window !== 'undefined') {
                (window as any).EkTelemetry = $t;
            }

            this.deviceId = await this.getDeviceId();
            getClient().updateHeaders([{
                'key': 'X-Device-ID',
                'value': this.deviceId,
                'action': 'add',
            }]);
            // eslint-disable-next-line no-console
            console.log('Device ID initialized:', this.deviceId);
        } catch (error) {
            console.error('AppCoreService initialization failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default AppCoreService.getInstance();
export { AppCoreService };
