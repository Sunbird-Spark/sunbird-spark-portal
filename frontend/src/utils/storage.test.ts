import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

describe('Storage Utils', () => {
    let getItemSpy: MockInstance;
    let setItemSpy: MockInstance;
    let removeItemSpy: MockInstance;
    let consoleWarnSpy: MockInstance;

    beforeEach(() => {
        // Clear storage before each test
        localStorage.clear();

        // Setup spies - targeting window.localStorage directly
        getItemSpy = vi.spyOn(window.localStorage, 'getItem');
        setItemSpy = vi.spyOn(window.localStorage, 'setItem');
        removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getStorageItem', () => {
        it('should retrieve an item from localStorage', () => {
            localStorage.setItem('test-key', 'test-val');

            const result = getStorageItem('test-key');

            expect(result).toBe('test-val');
            expect(getItemSpy).toHaveBeenCalledWith('test-key');
        });

        it('should return null if item does not exist', () => {
            const result = getStorageItem('non-existent');
            expect(result).toBeNull();
        });

        it('should return null and warn if localStorage throws error', () => {
            // Force the spy to throw
            getItemSpy.mockImplementation(() => {
                throw new Error('Access denied');
            });

            const result = getStorageItem('test-key');

            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith('LocalStorage access failed:', expect.any(Error));
        });
    });

    describe('setStorageItem', () => {
        it('should save an item to localStorage', () => {
            setStorageItem('key1', 'value1');

            expect(localStorage.getItem('key1')).toBe('value1');
            expect(setItemSpy).toHaveBeenCalledWith('key1', 'value1');
        });

        it('should warn if localStorage throws error', () => {
            setItemSpy.mockImplementation(() => {
                throw new Error('Quota exceeded');
            });

            setStorageItem('key1', 'value1');

            expect(consoleWarnSpy).toHaveBeenCalledWith('LocalStorage write failed:', expect.any(Error));
        });
    });

    describe('removeStorageItem', () => {
        it('should remove an item from localStorage', () => {
            localStorage.setItem('key-to-rem', 'val');

            removeStorageItem('key-to-rem');

            expect(localStorage.getItem('key-to-rem')).toBeNull();
            expect(removeItemSpy).toHaveBeenCalledWith('key-to-rem');
        });

        it('should warn if localStorage throws error', () => {
            removeItemSpy.mockImplementation(() => {
                throw new Error('Access denied');
            });

            removeStorageItem('key1');

            expect(consoleWarnSpy).toHaveBeenCalledWith('LocalStorage remove failed:', expect.any(Error));
        });
    });
});
