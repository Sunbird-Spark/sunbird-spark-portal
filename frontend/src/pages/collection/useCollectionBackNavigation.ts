import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";

/**
 * Resolves a stable "back" destination for the collection detail page.
 * Rejects /collection/ and /content/ paths to prevent multi-hop back chains.
 * Falls back to /explore, which is safe for both authenticated and anonymous users.
 */
export function useCollectionBackNavigation(collectionId: string | undefined): string {
  const location = useLocation();
  const stateFrom = (location.state as { from?: string } | null)?.from ?? '';

  const resolveBackTo = (from: string) =>
    from && !from.startsWith('/collection/') && !from.startsWith('/content/') ? from : '/explore';

  const backToRef = useRef<string>(resolveBackTo(stateFrom));
  const capturedCollectionIdRef = useRef<string | undefined>(collectionId);
  if (capturedCollectionIdRef.current !== collectionId) {
    capturedCollectionIdRef.current = collectionId;
    backToRef.current = resolveBackTo(stateFrom);
  }

  return backToRef.current;
}

/**
 * One-time auth info refresh when authenticated but userId is not yet available.
 * Forces a re-render once auth info is fetched.
 */
export function useAuthRefreshOnce(isAuthenticated: boolean): void {
  const [, setAuthRefresh] = useState(0);
  const triedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || userAuthInfoService.getUserId() || triedRef.current) return;
    triedRef.current = true;
    userAuthInfoService.getAuthInfo()
      .then(() => setAuthRefresh((n) => n + 1))
      .catch(() => {});
  }, [isAuthenticated]);
}
