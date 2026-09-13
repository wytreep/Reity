import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { CurrencyInput } from '@shared/components/CurrencyInput';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
import { useCategories, useCreateTransaction } from '@features/transactions/hooks/useTransactions';
import { Category } from '@shared/types';

interface Props { visible: boolean; onClose: () => void; }
type TxType = 'income' | 'expense';

export function NewTransactionModal({ visible, onClose }: Props) {
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState(0);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const filteredCats = categories.filter((c) => c.type === type);

  const handleTypeChange = (t: TxType) => { setType(t); setSelectedCat(null); };

  const handleSubmit = () => {
    if (amount <= 0) { setAmountError('Ingresa un monto válido'); return; }
    setAmountError('');
    createMutation.mutate(
      { amount, type, date: new Date().toISOString().split('T')[0], categoryId: selectedCat?.id, note: note.trim() || undefined },
      {
        onSuccess: () => { setAmount(0); setSelectedCat(null); setNote(''); onClose(); },
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
            <Text style={styles.title}>Nuevo movimiento</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.typeToggle}>
              <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]} onPress={() => handleTypeChange('income')}>
                <Ionicons name="arrow-up" size={14} color={type === 'income' ? '#fff' : Colors.textMuted} />
                <Text style={[styles.typeBtnText, type === 'income' && { color: '#fff' }]}>Ingreso</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} onPress={() => handleTypeChange('expense')}>
                <Ionicons name="arrow-down" size={14} color={type === 'expense' ? '#fff' : Colors.textMuted} />
                <Text style={[styles.typeBtnText, type === 'expense' && { color: '#fff' }]}>Gasto</Text>
              </TouchableOpacity>
            </View>
            <CurrencyInput value={amount} onChange={setAmount} containerStyle={{ marginBottom: 24 }} error={amountError} />
            <Text style={styles.sectionLabel}>Categoría</Text>
            <View style={styles.catGrid}>
              {filteredCats.map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.catChip, selectedCat?.id === cat.id && styles.catChipSelected]} onPress={() => setSelectedCat(cat)}>
                  <Ionicons name={cat.icon as any} size={20} color={selectedCat?.id === cat.id ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.catChipLabel, selectedCat?.id === cat.id && { color: Colors.primary }]} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Nota (opcional)" placeholder="¿En qué gastaste?" value={note} onChangeText={setNote} leftIcon="chatbubble-outline" containerStyle={{ marginBottom: 16 }} />
            <Button label="Guardar movimiento" onPress={handleSubmit} loading={createMutation.isPending} />
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
  typeToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 11 },
  typeBtnIncome: { backgroundColor: Colors.accentGreen },
  typeBtnExpense: { backgroundColor: Colors.accentRed },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.surfaceElevated, backgroundColor: Colors.surface },
  catChipSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(99,102,241,0.12)' },
  catChipLabel: { fontSize: 12, fontWeight: '500', color: Colors.textMuted, maxWidth: 80 },
});
