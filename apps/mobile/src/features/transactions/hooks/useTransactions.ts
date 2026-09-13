import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService, CreateTransactionData } from '../services/transactions.service';
import { categoriesService } from '../services/categories.service';

const KEYS = {
  all:     ['transactions'] as const,
  summary: (m: number, y: number) => ['transactions', 'summary', m, y] as const,
  cats:    ['categories'] as const,
};

export function useTransactionSummary(month: number, year: number) {
  return useQuery({ queryKey: KEYS.summary(month, year), queryFn: () => transactionsService.getSummary(month, year), staleTime: 1000 * 60 * 2 });
}

export function useCategories() {
  return useQuery({ queryKey: KEYS.cats, queryFn: categoriesService.findAll, staleTime: 1000 * 60 * 60 });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateTransactionData) => transactionsService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => transactionsService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
