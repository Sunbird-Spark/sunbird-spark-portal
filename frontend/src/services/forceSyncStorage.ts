const STORAGE_KEY = "course_batch_force_sync";
export const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function getStorage(): Record<string, number> {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

function setStorage(data: Record<string, number>): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function entryKey(userId: string, courseId: string, batchId: string): string {
  return `${userId}_${courseId}_${batchId}`;
}

export function canUseForceSync(
  userId: string,
  courseId: string,
  batchId: string
): boolean {
  const data = getStorage();
  const key = entryKey(userId, courseId, batchId);
  const epoch = data[key];
  if (epoch == null || typeof epoch !== "number") return true;
  return Date.now() - epoch >= COOLDOWN_MS;
}

export function markForceSyncUsed(
  userId: string,
  courseId: string,
  batchId: string
): void {
  const data = getStorage();
  data[entryKey(userId, courseId, batchId)] = Date.now();
  setStorage(data);
}

export function clearForceSyncUsed(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
