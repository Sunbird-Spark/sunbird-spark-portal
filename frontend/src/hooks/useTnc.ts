import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { TncService, AcceptTncResponse } from '@/services/TncService';
import { ApiResponse } from '@/lib/http-client';

const tncService = new TncService();

export const useAcceptTnc = (): UseMutationResult<
  ApiResponse<AcceptTncResponse>,
  Error,
  { tncConfig: any; identifier: string }
> => {
  return useMutation({
    mutationFn: ({ tncConfig, identifier }: { tncConfig: any; identifier: string }) =>
      tncService.acceptTnc(tncConfig, identifier),
  });
};
