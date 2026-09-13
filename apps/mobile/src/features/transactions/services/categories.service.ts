import { api } from '@shared/lib/api';
import { ApiResponse, Category } from '@shared/types';

export const categoriesService = {
  findAll: async (): Promise<Category[]> => {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },
};
