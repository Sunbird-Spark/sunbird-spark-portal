import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { lockService, type LockCreateResponse } from '@/services/LockService';
import { useUserRead } from '@/hooks/useUserRead';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

export interface ContentLockParams {
  /** Content identifier. */
  resourceId: string | undefined;
  /** e.g. 'Content'. */
  resourceType: string;
  /** Metadata from the read API (must include identifier, mimeType, contentType / primaryCategory). */
  metadata: Record<string, any> | null;
  /** Whether the lock request should be attempted. */
  enabled?: boolean;
}

export interface UseContentLockReturn {
  lockKey: string | null;
  lockError: string | null;
  isLocking: boolean;
  /** Explicitly retire the lock. Also called automatically on unmount. */
  retireLock: () => Promise<void>;
}

export const useContentLock = ({
  resourceId,
  resourceType,
  metadata,
  enabled = true,
}: ContentLockParams): UseContentLockReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: userData } = useUserRead();

  const [lockKey, setLockKey] = useState<string | null>(
    searchParams.get('lockKey'),
  );
  const [lockError, setLockError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const acquireLock = useCallback(async () => {
    if (!resourceId || !metadata || !enabled) return;

    // If we already have a lockKey (e.g. from query params), skip acquiring.
    if (searchParams.get('lockKey')) {
      setLockKey(searchParams.get('lockKey'));
      return;
    }

    const userId = userAuthInfoService.getUserId();
    if (!userId) {
      setLockError('User not authenticated.');
      return;
    }

    const userProfile = userData?.data?.response;
    const creatorName = userProfile
      ? `${userProfile.firstName ?? ''} ${userProfile.lastName ?? ''}`.trim() || 'User'
      : 'User';

    const resourceInfo = JSON.stringify({
      contentType: metadata.contentType ?? metadata.primaryCategory ?? '',
      identifier: resourceId,
      mimeType: metadata.mimeType ?? '',
    });

    const creatorInfo = JSON.stringify({
      name: creatorName,
      id: userId,
    });

    setIsLocking(true);
    setLockError(null);

    try {
      const response = await lockService.createLock({
        resourceId,
        resourceType,
        resourceInfo,
        creatorInfo,
        createdBy: userId,
        isRootOrgAdmin: false,
      });

      const result: LockCreateResponse = response.data;
      setLockKey(result.lockKey);

      // Persist lockKey in query params so editors / downstream consumers can read it.
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('lockKey', result.lockKey);
          return next;
        },
        { replace: true },
      );
    } catch (err: any) {
      const errCode = err?.response?.data?.params?.err ?? err?.error?.params?.err;
      if (errCode === 'RESOURCE_SELF_LOCKED' || errCode === 'RESOURCE_LOCKED') {
        const rawMsg =
          err?.response?.data?.params?.errmsg ?? 'Content is locked by another user.';
        setLockError(rawMsg.replace('resource', 'content'));
      } else {
        setLockError('Failed to acquire content lock.');
      }
    } finally {
      setIsLocking(false);
    }
  }, [resourceId, metadata, enabled, searchParams, setSearchParams, userData]);

  useEffect(() => {
    acquireLock();
  }, [acquireLock]);

  // Keep refs in sync for the unmount cleanup (which must not depend on state).
  const lockKeyRef = useRef(lockKey);
  lockKeyRef.current = lockKey;
  const resourceIdRef = useRef(resourceId);
  resourceIdRef.current = resourceId;
  const resourceTypeRef = useRef(resourceType);
  resourceTypeRef.current = resourceType;

  const retireLock = useCallback(async () => {
    const id = resourceIdRef.current;
    if (!id || !lockKeyRef.current) return;
    try {
      await lockService.retireLock(id, resourceTypeRef.current);
      lockKeyRef.current = null;
      setLockKey(null);
    } catch (err) {
      console.warn('Failed to retire content lock:', err);
    }
  }, []);

  // Lock retirement is handled explicitly by calling retireLock() when the editor closes.
  // No automatic retire on unmount — editors manage their own lock lifecycle.

  return { lockKey, lockError, isLocking, retireLock };
};
