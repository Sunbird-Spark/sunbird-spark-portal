import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import appCoreService, { AppCoreService } from './AppCoreService';
import * as storageUtils from '../utils/storage';
import { DeviceService } from '@project-sunbird/telemetry-sdk';

// Mock the storage utils
vi.mock('../utils/storage', () => ({
    getStorageItem: vi.fn(),
    setStorageItem: vi.fn(),
    removeStorageItem: vi.fn(),
}));

// Mock the telemetry SDK
vi.mock('@project-sunbird/telemetry-sdk', () => ({
    DeviceService: {
        getFingerPrint: vi.fn(),
    },
    $t: {
        initialize: vi.fn(),
    }
}));

describe('AppCoreService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        appCoreService.clearDeviceId();
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
            // Seed memory via internal state manipulation or by calling getDeviceId once
            (storageUtils.getStorageItem as any).mockReturnValue('stored-device-id');
            await appCoreService.getDeviceId();

            // Clear storage mock
            (storageUtils.getStorageItem as any).mockReturnValue(null);

            const result = await appCoreService.getDeviceId();
            expect(result).toBe('stored-device-id');
            // Should not call storage again
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
            (DeviceService.getFingerPrint as any).mockResolvedValue(mockFingerprint);

            const result = await appCoreService.getDeviceId();

            expect(result).toBe(mockFingerprint);
            expect(storageUtils.setStorageItem).toHaveBeenCalledWith('deviceId', mockFingerprint);
            expect(DeviceService.getFingerPrint).toHaveBeenCalled();
        });

        it('should throw error if DeviceService fails', async () => {
            (storageUtils.getStorageItem as any).mockReturnValue(null);
            (DeviceService.getFingerPrint as any).mockRejectedValue(new Error('SDK Error'));

            await expect(appCoreService.getDeviceId()).rejects.toThrow('SDK Error');
        });
    });

    describe('clearDeviceId', () => {
        it('should clear memory and storage', () => {
            appCoreService.clearDeviceId();

            expect(storageUtils.removeStorageItem).toHaveBeenCalledWith('deviceId');
            // 'deviceFingerprint' was removed from implementation
        });
    });

    describe('getDeviceInfo', () => {
        it('should return full device info object', async () => {
            // Setup device ID
            (storageUtils.getStorageItem as any).mockReturnValue('device-123');

            // Mock navigator (using Object.defineProperty as before)
            const originalUserAgent = navigator.userAgent;
            const originalPlatform = navigator.platform;

            // We need to be careful with navigator mocks in JSDOM/Vitest environment
            // but the original test did it this way.
             Object.defineProperty(navigator, 'userAgent', { value: 'TestAgent', configurable: true });
            Object.defineProperty(navigator, 'platform', { value: 'TestPlatform', configurable: true });

            const info = await appCoreService.getDeviceInfo();

            expect(info.deviceId).toBe('device-123');
            expect(info.userAgent).toBe('TestAgent');
            expect(info.platform).toBe('TestPlatform');
            expect(typeof info.timestamp).toBe('number');

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
        it('should initialize successfully and set global telemetry', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            (storageUtils.getStorageItem as any).mockReturnValue('init-id');

            await appCoreService.initialize();

            expect((window as any).EkTelemetry).toBeDefined();
            expect(consoleSpy).toHaveBeenCalledWith('Device ID initialized:', 'init-id');
        });

        it('should throw and log error initialization fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error');
            // Force getDeviceId to fail
            (storageUtils.getStorageItem as any).mockReturnValue(null);
            (DeviceService.getFingerPrint as any).mockRejectedValue(new Error('Init failed'));

            await expect(appCoreService.initialize()).rejects.toThrow('Init failed');
            expect(consoleSpy).toHaveBeenCalledWith('AppCoreService initialization failed:', expect.any(Error));
        });
    });
});
