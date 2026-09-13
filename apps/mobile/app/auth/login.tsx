import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@constants/colors';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useLogin } from '@features/auth/hooks/useAuth';
import { useBiometricAuth } from '@shared/hooks/useBiometricAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const loginMutation = useLogin();
  const { isBiometricAvailable, authenticateWithBiometric } = useBiometricAuth();

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email inválido';
    if (!password) e.password = 'La contraseña es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;
    loginMutation.mutate(
      { email: email.trim().toLowerCase(), password },
      { onError: (err: any) => Alert.alert('Error', err?.response?.data?.message ?? 'Error al iniciar sesión') }
    );
  };

  const handleBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (success) router.replace('/(tabs)/dashboard');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Reity</Text>
          <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
        </View>
        <Input label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" error={errors.email} />
        <Input label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} leftIcon="lock-closed-outline" isPassword error={errors.password} />
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        <Button label="Iniciar sesión" onPress={handleLogin} loading={loginMutation.isPending} style={styles.loginBtn} />
        {isBiometricAvailable && (
          <Button label="Acceder con biometría" onPress={handleBiometric} variant="outline" />
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 40, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { color: Colors.primary, fontSize: 13 },
  loginBtn: { marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  linkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
