import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import appCoreService, { AppCoreService } from './AppCoreService';
import * as storageUtils from '../utils/storage';

// Mock the storage utils
vi.mock('../utils/storage', () => ({
    getStorageItem: vi.fn(),
    setStorageItem: vi.fn(),
    removeStorageItem: vi.fn(),
}));

describe('AppCoreService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton private state if possible, or just use `appCoreService`
        // Since we can't easily reset private state of the singleton exported instance,
        // we might need to rely on `clearDeviceId` to reset state between tests.
        appCoreService.clearDeviceId();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Clean up global window object
        delete (window as any).EkTelemetry;
    });

    it('should maintain singleton instance', () => {
        const instance1 = AppCoreService.getInstance();
        const instance2 = AppCoreService.getInstance();
        expect(instance1).toBe(instance2);
        expect(instance1).toBe(appCoreService);
    });

    describe('getDeviceId', () => {
        it('should return deviceId from memory if available', async () => {
            // First, seed the memory
            (storageUtils.getStorageItem as any).mockReturnValue('stored-device-id');
            await appCoreService.getDeviceId();

            // Clear storage mock to ensure we aren't reading from it again
            (storageUtils.getStorageItem as any).mockReturnValue(null);

            const result = await appCoreService.getDeviceId();
            expect(result).toBe('stored-device-id');
            // Should not check storage second time
            expect(storageUtils.getStorageItem).toHaveBeenCalledTimes(1);
        });

        it('should return deviceId from localStorage if not in memory', async () => {
            (storageUtils.getStorageItem as any).mockReturnValue('local-storage-id');

            const result = await appCoreService.getDeviceId();

            expect(result).toBe('local-storage-id');
            expect(storageUtils.getStorageItem).toHaveBeenCalledWith('deviceId');
        });

        it('should generate new deviceId if not in memory or localStorage', async () => {
            (storageUtils.getStorageItem as any).mockReturnValue(null);

            const mockFingerprint = 'new-generated-fp';
            // Mock window.EkTelemetry
            (window as any).EkTelemetry = {
                getFingerPrint: vi.fn((cb) => cb(mockFingerprint, [], '1.0'))
            };

            const result = await appCoreService.getDeviceId();

            expect(result).toBe(mockFingerprint);
            expect(storageUtils.setStorageItem).toHaveBeenCalledWith('deviceId', mockFingerprint);
        });

        it('should throw error if EkTelemetry is not available', async () => {
            (storageUtils.getStorageItem as any).mockReturnValue(null);
            (window as any).EkTelemetry = undefined;

            await expect(appCoreService.getDeviceId()).rejects.toThrow('SunbirdTelemetry SDK not available');
        });
    });

    describe('getFingerprintData', () => {
        it('should return parsed data from storage', () => {
            const mockData = { id: 'fp-data' };
            (storageUtils.getStorageItem as any).mockReturnValue(JSON.stringify(mockData));

            const result = appCoreService.getFingerprintData();
            expect(result).toEqual(mockData);
        });

        it('should return null if storage is empty', () => {
            (storageUtils.getStorageItem as any).mockReturnValue(null);
            expect(appCoreService.getFingerprintData()).toBeNull();
        });

        it('should return null if JSON parse fails', () => {
            (storageUtils.getStorageItem as any).mockReturnValue('invalid-json');
            expect(appCoreService.getFingerprintData()).toBeNull();
        });
    });

    describe('clearDeviceId', () => {
        it('should clear memory and storage', () => {
            appCoreService.clearDeviceId();

            expect(storageUtils.removeStorageItem).toHaveBeenCalledWith('deviceId');
            expect(storageUtils.removeStorageItem).toHaveBeenCalledWith('deviceFingerprint');
        });
    });

    describe('getDeviceInfo', () => {
        it('should return full device info object', async () => {
            // Setup device ID
            (storageUtils.getStorageItem as any).mockReturnValue('device-123');

            // Mock navigator
            const originalUserAgent = navigator.userAgent;
            const originalPlatform = navigator.platform;

            Object.defineProperty(navigator, 'userAgent', { value: 'TestAgent', configurable: true });
            Object.defineProperty(navigator, 'platform', { value: 'TestPlatform', configurable: true });

            const info = await appCoreService.getDeviceInfo();

            expect(info.deviceId).toBe('device-123');
            expect(info.userAgent).toBe('TestAgent');
            expect(info.platform).toBe('TestPlatform');
            expect(typeof info.timestamp).toBe('number');

            // Cleanup
            Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
            Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
        });
    });

    describe('hasDeviceId', () => {
        it('should return true if deviceId exists in storage', () => {
            (storageUtils.getStorageItem as any).mockReturnValue('some-id');
            expect(appCoreService.hasDeviceId()).toBe(true);
        });

        it('should return false if deviceId does not exist in storage', () => {
            (storageUtils.getStorageItem as any).mockReturnValue(null);
            expect(appCoreService.hasDeviceId()).toBe(false);
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            (storageUtils.getStorageItem as any).mockReturnValue('init-id');

            await appCoreService.initialize();

            expect(consoleSpy).toHaveBeenCalledWith('Device ID initialized:', 'init-id');
        });

        it('should throw and log error initialization fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error');
            const error = new Error('Init failed');
            // Force getDeviceId to fail
            (storageUtils.getStorageItem as any).mockReturnValue(null);
            (window as any).EkTelemetry = undefined;

            await expect(appCoreService.initialize()).rejects.toThrow('SunbirdTelemetry SDK not available');
            expect(consoleSpy).toHaveBeenCalledWith('AppCoreService initialization failed:', expect.any(Error));
        });
    });
});
