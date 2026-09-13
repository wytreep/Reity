import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@shared/store/auth.store';
import { Colors } from '@constants/colors';

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();
  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Reity</Text>
      <Text style={styles.tagline}>Finanzas Personales Inteligentes</Text>
      {isLoading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
});
