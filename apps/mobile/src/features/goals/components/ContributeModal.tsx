import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { formatCOP } from '@constants/config';
import { CurrencyInput } from '@shared/components/CurrencyInput';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useAddContribution } from '@features/goals/hooks/useGoals';
import { GoalItem } from '@features/goals/services/goals.service';

interface Props { visible: boolean; onClose: () => void; goal: GoalItem | null; }

export function ContributeModal({ visible, onClose, goal }: Props) {
  const [amount, setAmount]           = useState(0);
  const [note, setNote]               = useState('');
  const [amountError, setAmountError] = useState('');
  const contributeMutation = useAddContribution();

  if (!goal) return null;

  const newProgress = Math.min(((goal.currentAmount + amount) / goal.targetAmount) * 100, 100);

  const handleSubmit = () => {
    if (amount <= 0) { setAmountError('Ingresa un monto válido'); return; }
    setAmountError('');
    contributeMutation.mutate(
      { goalId: goal.id, data: { amount, date: new Date().toISOString().split('T')[0], note: note.trim() || undefined } },
      {
        onSuccess: () => { setAmount(0); setNote(''); onClose(); },
        onError: (err: any) => Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo registrar el aporte'),
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
            <Text style={styles.title}>Agregar aporte</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 10 }}>{formatCOP(goal.currentAmount)} de {formatCOP(goal.targetAmount)} · {goal.progressPercentage.toFixed(1)}%</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${goal.progressPercentage}%` }]} />
              {amount > 0 && <View style={[styles.barPreview, { width: `${Math.min((amount / goal.targetAmount) * 100, 100 - goal.progressPercentage)}%`, left: `${goal.progressPercentage}%` }]} />}
            </View>
            {amount > 0 && <Text style={{ fontSize: 11, color: Colors.accentGreen, marginTop: 6, fontWeight: '500' }}>Después del aporte: {newProgress.toFixed(1)}%{newProgress >= 100 ? ' 🎉 ¡Meta completada!' : ''}</Text>}
          </View>
          <Text style={styles.sectionLabel}>Monto del aporte</Text>
          <CurrencyInput value={amount} onChange={setAmount} containerStyle={{ marginBottom: 16 }} error={amountError} />
          <Input label="Nota (opcional)" placeholder="Ej: Ahorro del bono" value={note} onChangeText={setNote} leftIcon="chatbubble-outline" containerStyle={{ marginBottom: 20 }} />
          <Button label="Registrar aporte" onPress={handleSubmit} loading={contributeMutation.isPending} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: Colors.surfaceCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: Colors.surfaceElevated },
  handle: { width: 36, height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  goalInfo: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.surfaceElevated },
  goalName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  barBg: { height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, position: 'relative', overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  barPreview: { position: 'absolute', top: 0, height: 8, backgroundColor: Colors.accentGreen, borderRadius: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
});
