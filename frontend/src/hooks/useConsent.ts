import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consentService } from '../services/consent';
import type { ConsentStatus } from '../types/consentTypes';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export interface UseConsentOptions {
  /** Collection/course identifier (objectId for consent API). */
  collectionId: string | undefined;
  /** Course channel (consumerId for consent API). */
  channel: string | undefined;
  enabled?: boolean;
}

export interface ConsentState {
  /** ACTIVE = sharing On, REVOKED or null = Off. */
  status: ConsentStatus | null;
  lastUpdatedOn: string | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  /** No consent record yet (e.g. 404) — show modal when true on first load. */
  noConsentYet: boolean;
}

export function useConsent({ collectionId, channel, enabled = true }: UseConsentOptions): ConsentState & {
  updateConsent: (status: ConsentStatus) => Promise<void>;
  isUpdating: boolean;
} {
  const queryClient = useQueryClient();
  const userId = userAuthInfoService.getUserId();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: ['consent', collectionId, channel, userId],
    queryFn: async () => {
      if (!userId || !channel || !collectionId) return { status: null as ConsentStatus | null, lastUpdatedOn: undefined };
      try {
        const res = await consentService.read({
          userId,
          consumerId: channel,
          objectId: collectionId,
        });
        const consents = (res.data as { consents?: { status: ConsentStatus; lastUpdatedOn?: string }[] })?.consents;
        const first = consents?.[0];
        return {
          status: (first?.status ?? null) as ConsentStatus | null,
          lastUpdatedOn: first?.lastUpdatedOn,
        };
      } catch {
        return { status: null, lastUpdatedOn: undefined };
      }
    },
    enabled: enabled && !!userId && !!channel && !!collectionId,
  });

  const { mutateAsync: updateConsentMutation, isPending: isUpdating } = useMutation({
    mutationFn: async (status: ConsentStatus) => {
      if (!userId || !channel || !collectionId) return;
      await consentService.update({
        status,
        userId,
        consumerId: channel,
        objectId: collectionId,
        objectType: 'Collection',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent', collectionId, channel, userId] });
    },
  });

  const noConsentYet = isFetched && !isError && data?.status == null;

  return {
    status: data?.status ?? null,
    lastUpdatedOn: data?.lastUpdatedOn,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    refetch,
    noConsentYet: !!noConsentYet,
    updateConsent: updateConsentMutation,
    isUpdating,
  };
}
