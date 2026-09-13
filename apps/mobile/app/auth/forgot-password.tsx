import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@constants/colors';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useForgotPassword } from '@features/auth/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);
  const forgotMutation = useForgotPassword();

  const handleSubmit = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un email válido'); return;
    }
    setEmailError('');
    forgotMutation.mutate(email.trim().toLowerCase(), {
      onSuccess: () => setSent(true),
      onError:   () => setSent(true),
    });
  };

  if (sent) return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.successTitle}>Revisa tu correo</Text>
      <Text style={styles.successText}>Si el email está registrado, recibirás instrucciones pronto.</Text>
      <Button label="Volver al login" onPress={() => router.replace('/(auth)/login')} variant="outline" style={{ marginTop: 24 }} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
          <Text style={{ color: Colors.primary, fontSize: 14 }}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>Ingresa tu email y te enviaremos un enlace de recuperación.</Text>
        <Input label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" error={emailError} containerStyle={{ marginBottom: 24 }} />
        <Button label="Enviar instrucciones" onPress={handleSubmit} loading={forgotMutation.isPending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, backgroundColor: Colors.surface },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 32 },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
