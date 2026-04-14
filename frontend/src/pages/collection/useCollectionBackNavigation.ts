import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";

/**
 * Resolves the "back" destination for the collection detail page.
 * Reads location.state.from set by the incoming navigation.
 * Rejects /collection/ and /content/ paths to prevent multi-hop back chains.
 * Falls back to /explore, which is safe for both authenticated and anonymous users.
 */
export function useCollectionBackNavigation(_collectionId: string | undefined): string {
  const location = useLocation();
  const stateFrom = (location.state as { from?: string } | null)?.from ?? '';
  return stateFrom && !stateFrom.startsWith('/collection/') && !stateFrom.startsWith('/content/')
    ? stateFrom
    : '/explore';
}

/**
 * One-time auth info refresh when authenticated but userId is not yet available.
 * Forces a re-render once auth info is fetched.
 */
export function useAuthRefreshOnce(isAuthenticated: boolean): void {
  const [, setAuthRefresh] = useState(0);
  const triedAuthRefreshRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || userAuthInfoService.getUserId() || triedAuthRefreshRef.current) return;
    triedAuthRefreshRef.current = true;
    userAuthInfoService
      .getAuthInfo()
      .then(() => setAuthRefresh((n) => n + 1))
      .catch(() => { });
  }, [isAuthenticated]);
}
