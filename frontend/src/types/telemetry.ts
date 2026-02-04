// Types for Sunbird Telemetry SDK integration

export type FingerprintComponent = unknown;

export interface FingerprintData {
    deviceId: string;
    components: FingerprintComponent[];
    version: string;
    timestamp: number;
}

export interface SunbirdTelemetry {
    getFingerPrint: (callback: (deviceId: string, components: FingerprintComponent[], version: string) => void) => void;
}
