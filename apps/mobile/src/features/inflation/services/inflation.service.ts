import { api } from '@shared/lib/api';
import { ApiResponse } from '@shared/types';

export interface InflationCurrent {
  month: number;
  year: number;
  ipcMonthly: number;
  ipcAnnual: number;
  source: string;
  fromCache: boolean;
}

export interface PurchasingPower {
  nominalBalance: number;
  realValue: number;
  annualLoss: number;
  dailyLoss: number;
  ipcAnnual: number;
  ipcMonthly: number;
  month: number;
  year: number;
  banrepTarget: number;
  deviation: number;
}

export const inflationService = {
  getCurrent: async (): Promise<InflationCurrent> => {
    const res = await api.get<ApiResponse<InflationCurrent>>('/inflation/current');
    return res.data.data;
  },
  getPurchasingPower: async (balance: number): Promise<PurchasingPower> => {
    const res = await api.get<ApiResponse<PurchasingPower>>(
      '/inflation/purchasing-power',
      { params: { balance } },
    );
    return res.data.data;
  },
};