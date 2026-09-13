import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@constants/colors';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useRegister } from '@features/auth/hooks/useAuth';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const registerMutation = useRegister();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = 'Mínimo 2 caracteres';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email inválido';
    if (!password || password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (password !== confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    registerMutation.mutate(
      { fullName: fullName.trim(), email: email.trim().toLowerCase(), password },
      { onError: (err: any) => {
          const msg = err?.response?.data?.message ?? 'Error al registrarse';
          Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : msg);
        }
      }
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Empieza a conocer el valor real de tu dinero</Text>
        <Input label="Nombre completo" placeholder="Edwin Carabali" value={fullName} onChangeText={setFullName} leftIcon="person-outline" error={errors.fullName} autoCapitalize="words" />
        <Input label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" error={errors.email} />
        <Input label="Contraseña" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} leftIcon="lock-closed-outline" isPassword error={errors.password} />
        <Input label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirm} onChangeText={setConfirm} leftIcon="shield-checkmark-outline" isPassword error={errors.confirm} />
        <Button label="Crear cuenta" onPress={handleRegister} loading={registerMutation.isPending} style={{ marginTop: 8 }} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backText: { color: Colors.primary, fontSize: 14 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  linkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
