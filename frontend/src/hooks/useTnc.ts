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
}
