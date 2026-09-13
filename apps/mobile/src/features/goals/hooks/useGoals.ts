import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService, CreateGoalData, CreateContributionData } from '../services/goals.service';

const KEYS = { all: ['goals'] as const, list: ['goals', 'list'] as const };

export function useGoals() {
  return useQuery({ queryKey: KEYS.list, queryFn: goalsService.findAll });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateGoalData) => goalsService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => goalsService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useAddContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateContributionData }) => goalsService.addContribution(goalId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
