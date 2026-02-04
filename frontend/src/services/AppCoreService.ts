

// TypeScript interfaces for device fingerprinting
interface FingerprintData {
    deviceId: string;
    components: any[];
    version: string;
    timestamp: number;
}

interface SunbirdTelemetry {
    getFingerPrint: (callback: (deviceId: string, components: any[], version: string) => void) => void;
}

declare global {
    interface Window {
        EkTelemetry: SunbirdTelemetry;
    }
}

/**
 * Core application service that provides common utilities
 * including device identification.
 */
class AppCoreService {
    private static instance: AppCoreService;
    private deviceId: string | null = null;

    private constructor() {
        // Private constructor for singleton pattern
    }

    static getInstance(): AppCoreService {
        if (!AppCoreService.instance) {
            AppCoreService.instance = new AppCoreService();
        }
        return AppCoreService.instance;
    }

    private getStorageItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('LocalStorage access failed:', e);
            return null;
        }
    }

    private setStorageItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    private removeStorageItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('LocalStorage remove failed:', e);
        }
    }

    async getDeviceId(): Promise<string> {
        // Return cached device ID if available
        if (this.deviceId) {
            return this.deviceId;
        }

        // Check localStorage first
        const stored = this.getStorageItem('deviceId');
        if (stored) {
            this.deviceId = stored;
            return stored;
        }

        // Generate device ID using telemetry SDK
        return new Promise<string>((resolve, reject) => {
            if (!window.EkTelemetry) {
                reject(new Error('SunbirdTelemetry SDK not available (EkTelemetry not found on window)'));
                return;
            }

            window.EkTelemetry.getFingerPrint((deviceId: string, components: any[], version: string) => {
                this.deviceId = deviceId;

                // Store in localStorage
                this.setStorageItem('deviceId', deviceId);

                const fingerprintData: FingerprintData = {
                    deviceId,
                    components,
                    version,
                    timestamp: Date.now()
                };

                this.setStorageItem('deviceFingerprint', JSON.stringify(fingerprintData));

                resolve(deviceId);
            });
        });
    }

    getFingerprintData(): FingerprintData | null {
        const stored = this.getStorageItem('deviceFingerprint');
        if (stored) {
            try {
                return JSON.parse(stored) as FingerprintData;
            } catch {
                return null;
            }
        }
        return null;
    }

    clearDeviceId(): void {
        this.deviceId = null;
        this.removeStorageItem('deviceId');
        this.removeStorageItem('deviceFingerprint');
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
        return this.getStorageItem('deviceId') !== null;
    }

    async initialize(): Promise<void> {
        try {
            console.log('Initializing AppCoreService...');

            // Preload device ID
            const deviceId = await this.getDeviceId();
            console.log('Device ID initialized:', deviceId);

        } catch (error) {
            console.error('AppCoreService initialization failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default AppCoreService.getInstance();
export { AppCoreService };
export type { FingerprintData };
