import { useQuery } from '@tanstack/react-query';
import { inflationService } from '../services/inflation.service';

export function useInflationCurrent() {
  return useQuery({
    queryKey: ['inflation', 'current'] as const,
    queryFn: inflationService.getCurrent,
    staleTime: 1000 * 60 * 60,
  });
}

export function usePurchasingPower(balance: number) {
  return useQuery({
    queryKey: ['inflation', 'power', balance] as const,
    queryFn: () => inflationService.getPurchasingPower(balance),
    enabled: balance > 0,
    staleTime: 1000 * 60 * 60,
  });
}