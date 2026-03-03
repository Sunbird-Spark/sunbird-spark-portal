import { useMutation, UseMutationResult, useQuery } from '@tanstack/react-query';
import { TncService, AcceptTncResponse } from '@/services/TncService';
import { ApiResponse } from '@/lib/http-client';

const tncService = new TncService();

export const useAcceptTnc = (): UseMutationResult<
  ApiResponse<AcceptTncResponse>,
  Error,
  { tncConfig: any; identifier?: string; tncType?: string }
> => {
  return useMutation({
    mutationFn: ({ tncConfig, identifier, tncType }: { tncConfig: any; identifier?: string; tncType?: string }) =>
      tncService.acceptTnc(tncConfig, identifier, tncType),
  });
};

export const useGetTncUrl = (tncConfig: any) => {
  return useQuery({
      queryKey: ['tncUrl', tncConfig],
      queryFn: () => tncService.getTncUrl(tncConfig),
      enabled: !!tncConfig,
    });
};

export const useTncCheck = (userProfile: any, tncConfig: any): {
  needsTncAcceptance: boolean;
  latestVersion: string;
  termsUrl: string;
} => {
  // If the user profile is not yet loaded, acceptance cannot be evaluated.
  if (!userProfile) {
    return { needsTncAcceptance: false, latestVersion: '', termsUrl: '' };
  }

  const latestVersion = tncConfig ? tncService.getLatestVersion(tncConfig) : '';
  const termsUrl = tncConfig ? tncService.getTncUrl(tncConfig) : '';
  const acceptedVersion = userProfile?.tncAcceptedVersion || '';

  const needsTncAcceptance = !!latestVersion && acceptedVersion !== latestVersion;

  return { needsTncAcceptance, latestVersion, termsUrl };
};
