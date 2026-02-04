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
        SunbirdTelemetry: SunbirdTelemetry;
    }
}

/**
 * Core application service that provides common utilities
 * including device identification.
 */
class AppCoreService {
    private static instance: AppCoreService;
    private deviceId: string | null = null;
    private isLoaded: boolean = false;
    private isLoading: boolean = false;
    private callbacks: (() => void)[] = [];

    private constructor() {
        // Private constructor for singleton pattern
    }

    static getInstance(): AppCoreService {
        if (!AppCoreService.instance) {
            AppCoreService.instance = new AppCoreService();
        }
        return AppCoreService.instance;
    }

    // Load the telemetry SDK from CDN
    private async loadTelemetrySDK(): Promise<void> {
        if (this.isLoaded) return Promise.resolve();
        if (this.isLoading) {
            return new Promise<void>(resolve => this.callbacks.push(resolve));
        }

        this.isLoading = true;

        return new Promise<void>((resolve, reject) => {
            // Check if already available
            if (window.SunbirdTelemetry) {
                this.isLoaded = true;
                this.isLoading = false;
                this.callbacks.forEach(cb => cb());
                this.callbacks = [];
                resolve();
                return;
            }

            // Load script from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@project-sunbird/telemetry-sdk@0.0.29/index.js';
            script.async = true;

            script.onload = () => {
                this.isLoaded = true;
                this.isLoading = false;
                this.callbacks.forEach(cb => cb());
                this.callbacks = [];
                resolve();
            };

            script.onerror = () => {
                this.isLoading = false;
                reject(new Error('Failed to load telemetry SDK from CDN'));
            };

            document.head.appendChild(script);
        });
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

        // Load SDK and generate device ID
        await this.loadTelemetrySDK();

        return new Promise<string>((resolve, reject) => {
            if (!window.SunbirdTelemetry) {
                reject(new Error('SunbirdTelemetry SDK not available'));
                return;
            }

            window.SunbirdTelemetry.getFingerPrint((deviceId: string, components: any[], version: string) => {
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
