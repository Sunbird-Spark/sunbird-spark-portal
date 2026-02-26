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

  // Store metadata in a ref to avoid recreating acquireLock on every metadata change
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  // Track if we've already attempted to acquire a lock for this resource
  const attemptedLockRef = useRef<string | null>(null);

  const acquireLock = useCallback(async () => {
    if (!resourceId || !metadataRef.current || !enabled) return;

    // Skip if we've already attempted to lock this resource
    if (attemptedLockRef.current === resourceId) return;

    // If we already have a lockKey (e.g. from query params), skip acquiring.
    if (searchParams.get('lockKey')) {
      setLockKey(searchParams.get('lockKey'));
      attemptedLockRef.current = resourceId;
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

    const currentMetadata = metadataRef.current;
    const resourceInfo = JSON.stringify({
      contentType: currentMetadata.contentType ?? currentMetadata.primaryCategory ?? '',
      identifier: resourceId,
      mimeType: currentMetadata.mimeType ?? '',
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
      attemptedLockRef.current = resourceId;

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
      attemptedLockRef.current = resourceId; // Mark as attempted even on error
    } finally {
      setIsLocking(false);
    }
  }, [resourceId, enabled, searchParams, setSearchParams, userData, resourceType]); // Removed metadata from dependencies

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
