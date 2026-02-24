import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { questionSetService } from '../services/QuestionSetService';

export const useQuestionSetRetire = (): UseMutationResult<any, Error, string> => {
  return useMutation({
    mutationFn: (questionSetId: string) => questionSetService.retireQuestionSet(questionSetId),
  });
};