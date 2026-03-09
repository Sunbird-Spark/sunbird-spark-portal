import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consentService } from '../services/consent';
import type { ConsentStatus } from '../types/consentTypes';
import { useUserId } from './useAuthInfo';

export interface UseConsentOptions {
  collectionId: string | undefined;
  channel: string | undefined;
  enabled?: boolean;
}

export interface ConsentState {
  status: ConsentStatus | null;
  lastUpdatedOn: string | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useConsent({ collectionId, channel, enabled = true }: UseConsentOptions): ConsentState & {
  updateConsent: (status: ConsentStatus) => Promise<void>;
  isUpdating: boolean;
} {
  const queryClient = useQueryClient();
  const userId = useUserId();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['consent', collectionId, channel, userId],
    queryFn: async () => {
      if (!userId || !channel || !collectionId) return { status: null as ConsentStatus | null, lastUpdatedOn: undefined };
      // Let errors propagate so isError reflects network/server failures. For "no consent yet",
      // API should return 200 with empty or missing consents rather than 404.
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

  return {
    status: data?.status ?? null,
    lastUpdatedOn: data?.lastUpdatedOn,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    refetch,
    updateConsent: updateConsentMutation,
    isUpdating,
  };
}
