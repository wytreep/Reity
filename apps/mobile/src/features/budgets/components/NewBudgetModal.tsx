import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { CurrencyInput } from '@shared/components/CurrencyInput';
import { Button } from '@shared/components/Button';
import { useCategories } from '@features/transactions/hooks/useTransactions';
import { useCreateBudget } from '@features/budgets/hooks/useBudgets';
import { Category } from '@shared/types';

interface Props { visible: boolean; onClose: () => void; month: number; year: number; }

export function NewBudgetModal({ visible, onClose, month, year }: Props) {
  const [amount, setAmount]           = useState(0);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [amountError, setAmountError] = useState('');
  const [catError, setCatError]       = useState('');
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateBudget();
  const expenseCats = categories.filter((c) => c.type === 'expense');

  const handleSubmit = () => {
    let valid = true;
    if (amount <= 0)  { setAmountError('Ingresa un monto válido'); valid = false; } else setAmountError('');
    if (!selectedCat) { setCatError('Selecciona una categoría');  valid = false; } else setCatError('');
    if (!valid) return;
    createMutation.mutate(
      { categoryId: selectedCat!.id, amount, month, year },
      {
        onSuccess: () => { setAmount(0); setSelectedCat(null); onClose(); },
        onError: (err: any) => Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo guardar'),
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
            <Text style={styles.title}>Nuevo presupuesto</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.periodBadge}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              <Text style={styles.periodText}>{new Date(year, month - 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</Text>
            </View>
            <Text style={styles.sectionLabel}>Límite mensual</Text>
            <CurrencyInput value={amount} onChange={setAmount} containerStyle={{ marginBottom: 20 }} error={amountError} />
            <Text style={styles.sectionLabel}>Categoría de gasto</Text>
            {catError ? <Text style={{ fontSize: 12, color: Colors.accentRed, marginBottom: 6 }}>{catError}</Text> : null}
            <View style={styles.catGrid}>
              {expenseCats.map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.catChip, selectedCat?.id === cat.id && styles.catChipSelected]} onPress={() => { setSelectedCat(cat); setCatError(''); }}>
                  <Ionicons name={cat.icon as any} size={18} color={selectedCat?.id === cat.id ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.catChipLabel, selectedCat?.id === cat.id && { color: Colors.primary }]} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button label="Crear presupuesto" onPress={handleSubmit} loading={createMutation.isPending} />
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
  periodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 20 },
  periodText: { fontSize: 13, color: Colors.primary, fontWeight: '600', textTransform: 'capitalize' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.surfaceElevated, backgroundColor: Colors.surface },
  catChipSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(99,102,241,0.12)' },
  catChipLabel: { fontSize: 12, fontWeight: '500', color: Colors.textMuted, maxWidth: 80 },
});
