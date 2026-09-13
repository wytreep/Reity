import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { CurrencyInput } from '@shared/components/CurrencyInput';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useCreateGoal } from '@features/goals/hooks/useGoals';

interface Props { visible: boolean; onClose: () => void; }

export function NewGoalModal({ visible, onClose }: Props) {
  const [name, setName]         = useState('');
  const [target, setTarget]     = useState(0);
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const createMutation = useCreateGoal();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Mínimo 2 caracteres';
    if (target <= 0) e.target = 'Ingresa un monto válido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate(
      { name: name.trim(), targetAmount: target, deadline: deadline || undefined },
      {
        onSuccess: () => { setName(''); setTarget(0); setDeadline(''); setErrors({}); onClose(); },
        onError: (err: any) => Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo crear la meta'),
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Nueva meta</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input label="Nombre de la meta" placeholder="Ej: MacBook Pro, Viaje a Japón..." value={name} onChangeText={setName} leftIcon="flag-outline" error={errors.name} />
            <Text style={styles.sectionLabel}>Monto objetivo</Text>
            <CurrencyInput value={target} onChange={setTarget} containerStyle={{ marginBottom: 16 }} error={errors.target} />
            <Input label="Fecha límite (opcional)" placeholder="AAAA-MM-DD" value={deadline} onChangeText={setDeadline} leftIcon="calendar-outline" />
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={14} color={Colors.accentAmber} />
              <Text style={styles.tipText}>Agrega aportes después de crear la meta para que Reity calcule cuándo la alcanzarás.</Text>
            </View>
            <Button label="Crear meta" onPress={handleSubmit} loading={createMutation.isPending} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, maxHeight: '90%', borderTopWidth: 1, borderTopColor: Colors.surfaceElevated },
  handle: { width: 36, height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  tip: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' },
  tipText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
});
