declare module '@project-sunbird/telemetry-sdk' {
    export function getFingerPrint(
        callback: (deviceId: string, components: any[], version: string) => void
    ): void;
}
