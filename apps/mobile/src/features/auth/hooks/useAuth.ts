import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuthStore } from '@shared/store/auth.store';
import { authService } from '../services/auth.service';

export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => { setAuth(data.user, data.accessToken, data.refreshToken); router.replace('/(tabs)/dashboard'); },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => { setAuth(data.user, data.accessToken, data.refreshToken); router.replace('/(tabs)/dashboard'); },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      const { storage } = await import('@shared/lib/storage');
      const refreshToken = storage.getString('refreshToken') ?? '';
      await authService.logout(refreshToken);
    },
    onSettled: () => { clearAuth(); router.replace('/(auth)/login'); },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authService.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authService.resetPassword });
}

