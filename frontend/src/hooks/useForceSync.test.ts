import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForceSync } from "./useForceSync";

const mockToast = vi.fn();
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/hooks/useAppI18n", () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const mockForceSyncActivityAgg = vi.hoisted(() => vi.fn());
const mockCanUseForceSync = vi.hoisted(() => vi.fn());
const mockMarkForceSyncUsed = vi.hoisted(() => vi.fn());

vi.mock("@/services/collection", () => ({
  batchService: {
    forceSyncActivityAgg: mockForceSyncActivityAgg,
  },
}));

vi.mock("@/services/forceSyncStorage", () => ({
  canUseForceSync: (...args: unknown[]) => mockCanUseForceSync(...args),
  markForceSyncUsed: mockMarkForceSyncUsed,
}));

describe("useForceSync", () => {
  const courseProgressProps100 = {
    totalContentCount: 10,
    completedContentCount: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanUseForceSync.mockReturnValue(true);
  });

  it("returns showForceSyncButton true when progress 100% and canUseForceSync true", () => {
    const { result } = renderHook(() =>
      useForceSync("u1", "c1", "b1", courseProgressProps100)
    );
    expect(result.current.showForceSyncButton).toBe(true);
    expect(mockCanUseForceSync).toHaveBeenCalledWith("u1", "c1", "b1");
  });

  it("returns showForceSyncButton false when userId is null", () => {
    const { result } = renderHook(() =>
      useForceSync(null, "c1", "b1", courseProgressProps100)
    );
    expect(result.current.showForceSyncButton).toBe(false);
  });

  it("returns showForceSyncButton false when progress is not 100%", () => {
    const { result } = renderHook(() =>
      useForceSync("u1", "c1", "b1", {
        totalContentCount: 10,
        completedContentCount: 5,
      })
    );
    expect(result.current.showForceSyncButton).toBe(false);
  });

  it("returns showForceSyncButton false when canUseForceSync returns false", () => {
    mockCanUseForceSync.mockReturnValue(false);
    const { result } = renderHook(() =>
      useForceSync("u1", "c1", "b1", courseProgressProps100)
    );
    expect(result.current.showForceSyncButton).toBe(false);
  });

  it("calls forceSyncActivityAgg and marks used and toasts on success", async () => {
    mockForceSyncActivityAgg.mockResolvedValue({ data: {}, status: 200, headers: {} });
    const { result } = renderHook(() =>
      useForceSync("u1", "c1", "b1", courseProgressProps100)
    );

    await act(async () => {
      await result.current.handleForceSync();
    });

    expect(mockForceSyncActivityAgg).toHaveBeenCalledWith({
      userId: "u1",
      courseId: "c1",
      batchId: "b1",
    });
    expect(mockMarkForceSyncUsed).toHaveBeenCalledWith("u1", "c1", "b1");
    expect(mockToast).toHaveBeenCalledWith({
      title: "success",
      description: "courseDetails.forceSyncSuccess",
      variant: "default",
    });
  });

  it("does not call API when userId is missing", async () => {
    const { result } = renderHook(() =>
      useForceSync(undefined, "c1", "b1", courseProgressProps100)
    );

    await act(async () => {
      await result.current.handleForceSync();
    });

    expect(mockForceSyncActivityAgg).not.toHaveBeenCalled();
  });

  it("toasts error and does not mark used when API fails", async () => {
    mockForceSyncActivityAgg.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() =>
      useForceSync("u1", "c1", "b1", courseProgressProps100)
    );

    await act(async () => {
      await result.current.handleForceSync();
    });

    expect(mockMarkForceSyncUsed).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: "error",
      description: "Network error",
      variant: "destructive",
    });
  });

  it("sets isForceSyncing during API call", async () => {
    let resolvePromise: () => void;
    mockForceSyncActivityAgg.mockReturnValue(
      new Promise<void>((r) => {
        resolvePromise = r;
      })
    );
    const { result } = renderHook(() =>
      useForceSync("u1", "c1", "b1", courseProgressProps100)
    );

    expect(result.current.isForceSyncing).toBe(false);

    act(() => {
      result.current.handleForceSync();
    });

    expect(result.current.isForceSyncing).toBe(true);

    await act(async () => {
      resolvePromise!();
    });

    expect(result.current.isForceSyncing).toBe(false);
  });
});
