import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { certificateService } from '../services/CertificateService';
import { CertTemplateSummary } from '../services/CertificateTypes';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

/** Resolve the current user's userId */
export async function resolveUserId(): Promise<string | null> {
  let userId = userAuthInfoService.getUserId();
  if (!userId) {
    const authInfo = await userAuthInfoService.getAuthInfo();
    userId = authInfo?.uid ?? null;
  }
  return userId;
}

/** Resolve the current user's rootOrgId (channel) */
async function resolveChannel(): Promise<{ channel: string; userId: string } | null> {
  const userId = await resolveUserId();
  if (!userId) return null;

  const userResponse = await userService.userRead(userId);
  const channel =
    ((userResponse.data.response as Record<string, unknown>).rootOrgId as string | undefined) ??
    null;
  if (!channel) return null;
  return { channel, userId };
}

/**
 * Fetches available certificate templates for the current user's org.
 * Used to populate the template picker in AddCertificateModal.
 */
export const useCertTemplates = (): UseQueryResult<CertTemplateSummary[], Error> => {
  return useQuery({
    queryKey: ['certTemplates'],
    queryFn: async (): Promise<CertTemplateSummary[]> => {
      const ctx = await resolveChannel();
      if (!ctx) return [];

      const response = await certificateService.searchCertTemplates(ctx.channel);
      const content: any[] = response?.data?.content ?? [];
      return content.map((item) => ({
        identifier: item.identifier ?? item.IL_UNIQUE_ID ?? '',
        name: item.name ?? 'Certificate Template',
        previewUrl: item.previewUrl ?? item.artifactUrl ?? item.downloadUrl,
        artifactUrl: item.artifactUrl ?? item.downloadUrl,
        downloadUrl: item.downloadUrl,
        issuer: item.issuer,
        signatoryList: Array.isArray(item.signatoryList)
          ? item.signatoryList.map((s: any) => ({
              name: s.name ?? '',
              designation: s.designation ?? '',
              id: s.id ?? `${s.name}/${s.name}`,
              image: s.image ?? '',
            }))
          : undefined,
      }));
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};

export type ImageAsset = { identifier: string; name: string; url: string };

/**
 * Fetches only the current user's uploaded image assets (My Images tab).
 */
export const useMyImages = (): UseQueryResult<ImageAsset[], Error> => {
  return useQuery({
    queryKey: ['myImages'],
    queryFn: async () => {
      const ctx = await resolveChannel();
      if (!ctx) return [];

      const response = await certificateService.searchLogos(ctx.channel, ctx.userId);
      const content: any[] = response?.data?.content ?? [];
      return content.map((item) => ({
        identifier: item.identifier ?? '',
        name: item.name ?? 'Image',
        url: item.artifactUrl ?? item.downloadUrl ?? '',
      }));
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};

/**
 * Fetches all org image assets (All Images tab — no user filter).
 */
export const useAllImages = (): UseQueryResult<ImageAsset[], Error> => {
  return useQuery({
    queryKey: ['allImages'],
    queryFn: async () => {
      const ctx = await resolveChannel();
      if (!ctx) return [];

      const response = await certificateService.searchLogos(ctx.channel);
      const content: any[] = response?.data?.content ?? [];
      return content.map((item) => ({
        identifier: item.identifier ?? '',
        name: item.name ?? 'Image',
        url: item.artifactUrl ?? item.downloadUrl ?? '',
      }));
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};
