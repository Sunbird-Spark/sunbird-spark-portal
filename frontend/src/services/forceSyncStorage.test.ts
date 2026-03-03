import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  canUseForceSync,
  markForceSyncUsed,
  clearForceSyncUsed,
  COOLDOWN_MS,
} from "./forceSyncStorage";

const STORAGE_KEY = "course_batch_force_sync";
/** Must match implementation cooldown for "older than cooldown" test */

describe("forceSyncStorage", () => {
  let mockStorage: Record<string, string>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    mockStorage = {};
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        length: 0,
        key: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  });

  describe("canUseForceSync", () => {
    it("returns true when no entry exists for userId_courseId_batchId", () => {
      expect(canUseForceSync("u1", "c1", "b1")).toBe(true);
    });

    it("returns false when entry exists and is within cooldown", () => {
      markForceSyncUsed("u1", "c1", "b1");
      expect(canUseForceSync("u1", "c1", "b1")).toBe(false);
    });

    it("returns true when entry exists but is older than cooldown", () => {
      const now = 1000000000000;
      vi.useFakeTimers({ now });
      mockStorage[STORAGE_KEY] = JSON.stringify({
        u1_c1_b1: now - COOLDOWN_MS - 1,
      });
      expect(canUseForceSync("u1", "c1", "b1")).toBe(true);
      vi.useRealTimers();
    });

    it("returns true for different user/course/batch when one is marked used", () => {
      markForceSyncUsed("u1", "c1", "b1");
      expect(canUseForceSync("u2", "c1", "b1")).toBe(true);
      expect(canUseForceSync("u1", "c2", "b1")).toBe(true);
      expect(canUseForceSync("u1", "c1", "b2")).toBe(true);
    });
  });

  describe("markForceSyncUsed", () => {
    it("stores entry with current timestamp", () => {
      const now = 1234567890123;
      vi.useFakeTimers({ now });
      markForceSyncUsed("u1", "c1", "b1");
      expect(mockStorage[STORAGE_KEY]).toBe(
        JSON.stringify({ u1_c1_b1: now })
      );
      vi.useRealTimers();
    });

    it("merges with existing entries", () => {
      const now = 1000000000000;
      vi.useFakeTimers({ now });
      markForceSyncUsed("u1", "c1", "b1");
      markForceSyncUsed("u2", "c2", "b2");
      const parsed = JSON.parse(mockStorage[STORAGE_KEY] ?? "{}");
      expect(parsed.u1_c1_b1).toBe(now);
      expect(parsed.u2_c2_b2).toBe(now);
      vi.useRealTimers();
    });
  });

  describe("clearForceSyncUsed", () => {
    it("removes the storage key", () => {
      markForceSyncUsed("u1", "c1", "b1");
      
      expect(mockStorage[STORAGE_KEY]).toBeDefined();
      clearForceSyncUsed();
      expect(mockStorage[STORAGE_KEY]).toBeUndefined();
    });

    it("allows force sync again after clear", () => {
      markForceSyncUsed("u1", "c1", "b1");
      expect(canUseForceSync("u1", "c1", "b1")).toBe(false);
      clearForceSyncUsed();
      expect(canUseForceSync("u1", "c1", "b1")).toBe(true);
    });
  });
});
