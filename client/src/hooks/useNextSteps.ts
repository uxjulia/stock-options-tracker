import { useQuery } from '@tanstack/react-query';
import { getNextSteps } from '../api/nextsteps';

export function useNextSteps() {
  return useQuery({
    queryKey: ['next-steps'],
    queryFn: getNextSteps,
    staleTime: 2 * 60 * 1000,
  });
}
