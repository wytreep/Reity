import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@shared/lib/queryClient';
import { useAuthStore } from '@shared/store/auth.store';

export default function RootLayout() {
  const { restoreSession } = useAuthStore();
  useEffect(() => { restoreSession(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
      </Stack>
    </QueryClientProvider>
  );
}
