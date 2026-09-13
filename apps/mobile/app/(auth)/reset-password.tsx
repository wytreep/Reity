import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useResetPassword } from '@features/auth/hooks/useAuth';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [token, setToken] = useState(params.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const resetMutation = useResetPassword();

  // Evaluaciones en tiempo real de seguridad
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isStrong = hasMinLength && hasUpper && hasLower && hasNumber;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!token.trim()) e.token = 'Ingresa el código de 6 dígitos o el token recibido';
    if (!newPassword) {
      e.newPassword = 'Ingresa la nueva contraseña';
    } else if (!isStrong) {
      e.newPassword = 'La contraseña no cumple los requisitos de seguridad';
    }
    if (newPassword !== confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = () => {
    if (!validate()) return;
    resetMutation.mutate(
      { token: token.trim(), newPassword },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: (err: any) => {
          const resMsg = err?.response?.data?.message;
          const msg = resMsg
            ? (Array.isArray(resMsg) ? resMsg.join('\n') : resMsg)
            : (err?.message === 'Network Error' || !err?.response
                ? 'No se pudo conectar con el servidor. Verifica tu conexión.'
                : err?.message ?? 'Error al restablecer la contraseña');
          Alert.alert('Error', msg);
        },
      }
    );
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-done" size={48} color={Colors.accentGreen} />
        </View>
        <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
        <Text style={styles.successSubtitle}>
          Tu contraseña ha sido cambiada de forma segura. Ya puedes iniciar sesión con tus nuevas credenciales.
        </Text>
        <Button
          label="Iniciar sesión ahora"
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginTop: 32, width: '100%' }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos recibido por correo y establece tu nueva clave segura.
        </Text>

        <Input
          label="Código o Token de recuperación"
          placeholder="Ej: 123456"
          value={token}
          onChangeText={setToken}
          leftIcon="key-outline"
          error={errors.token}
          autoCapitalize="none"
        />

        <Input
          label="Nueva contraseña"
          placeholder="Mínimo 8 caracteres"
          value={newPassword}
          onChangeText={setNewPassword}
          leftIcon="lock-closed-outline"
          isPassword
          error={errors.newPassword}
        />

        {/* Indicadores de fortaleza */}
        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Requisitos de seguridad:</Text>
          <View style={styles.reqItem}>
            <Ionicons name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={hasMinLength ? Colors.accentGreen : Colors.textMuted} />
            <Text style={[styles.reqText, hasMinLength && styles.reqTextValid]}>Al menos 8 caracteres</Text>
          </View>
          <View style={styles.reqItem}>
            <Ionicons name={hasUpper ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={hasUpper ? Colors.accentGreen : Colors.textMuted} />
            <Text style={[styles.reqText, hasUpper && styles.reqTextValid]}>Al menos una letra mayúscula (A-Z)</Text>
          </View>
          <View style={styles.reqItem}>
            <Ionicons name={hasLower ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={hasLower ? Colors.accentGreen : Colors.textMuted} />
            <Text style={[styles.reqText, hasLower && styles.reqTextValid]}>Al menos una letra minúscula (a-z)</Text>
          </View>
          <View style={styles.reqItem}>
            <Ionicons name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={hasNumber ? Colors.accentGreen : Colors.textMuted} />
            <Text style={[styles.reqText, hasNumber && styles.reqTextValid]}>Al menos un número (0-9)</Text>
          </View>
        </View>

        <Input
          label="Confirmar nueva contraseña"
          placeholder="Repite la nueva contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon="shield-checkmark-outline"
          isPassword
          error={errors.confirmPassword}
        />

        <Button
          label="Actualizar contraseña"
          onPress={handleReset}
          loading={resetMutation.isPending}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backText: { color: Colors.primary, fontSize: 14 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 28 },

  requirementsBox: {
    backgroundColor: Colors.surfaceCard,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
    marginBottom: 16,
  },
  requirementsTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  reqItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  reqText: { color: Colors.textMuted, fontSize: 12, marginLeft: 8 },
  reqTextValid: { color: Colors.accentGreen },

  successContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  successSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
});
