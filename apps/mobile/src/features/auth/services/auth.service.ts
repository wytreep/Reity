import { api } from '@shared/lib/api';
import { ApiResponse, User } from '@shared/types';

interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

export const authService = {
  register: async (data: { email: string; password: string; fullName: string }): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return res.data.data;
  },
  resetPassword: async (data: { token: string; newPassword: string }): Promise<{ message: string }> => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    return res.data.data;
  },
};

