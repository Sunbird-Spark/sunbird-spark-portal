

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

    async getDeviceId(): Promise<string> {
        // Return cached device ID if available
        if (this.deviceId) {
            return this.deviceId;
        }

        // Check localStorage first
        const stored = localStorage.getItem('deviceId');
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
                localStorage.setItem('deviceId', deviceId);

                const fingerprintData: FingerprintData = {
                    deviceId,
                    components,
                    version,
                    timestamp: Date.now()
                };

                localStorage.setItem('deviceFingerprint', JSON.stringify(fingerprintData));

                resolve(deviceId);
            });
        });
    }

    getFingerprintData(): FingerprintData | null {
        const stored = localStorage.getItem('deviceFingerprint');
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
        localStorage.removeItem('deviceId');
        localStorage.removeItem('deviceFingerprint');
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
        return localStorage.getItem('deviceId') !== null;
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
