import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';

interface QuestionSetCreateParams {
  name: string;
  createdBy: string;
  createdFor: string[];
  framework: string;
  creator: string;
}

export const useQuestionSetCreate = (): UseMutationResult<any, Error, QuestionSetCreateParams> => {
  return useMutation({
    mutationFn: (params: QuestionSetCreateParams) => questionSetService.createQuestionSet(params),
  });
};
