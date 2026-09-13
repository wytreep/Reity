import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { formatCOP } from '@constants/config';
import { useTransactionSummary, useDeleteTransaction } from '@features/transactions/hooks/useTransactions';
import { NewTransactionModal } from '@features/transactions/components/NewTransactionModal';
import { MonthlyChart } from '@features/transactions/components/MonthlyChart';
import { Transaction } from '@shared/types';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const [filter, setFilter]             = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const { data: summary, isLoading, refetch } = useTransactionSummary(month, year);
  const deleteMutation = useDeleteTransaction();

  const transactions = (summary?.transactions ?? []).filter((t) =>
    filter === 'all' ? true : t.type === filter
  );

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.txItem} onLongPress={() => handleDelete(item.id)} activeOpacity={0.7}>
      <View style={[styles.txIcon, { backgroundColor: item.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
        <Ionicons name={(item.category?.icon as any) ?? 'cash-outline'} size={18} color={item.type === 'income' ? Colors.accentGreen : Colors.accentRed} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{item.category?.name ?? 'Sin categoría'}</Text>
        <Text style={styles.txNote} numberOfLines={1}>{item.note ?? item.date}</Text>
      </View>
      <Text style={[styles.txAmount, { color: item.type === 'income' ? Colors.accentGreen : Colors.accentRed }]}>
        {item.type === 'income' ? '+' : '-'}{formatCOP(Number(item.amount))}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        ListHeaderComponent={() => (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Movimientos</Text>
                <Text style={styles.period}>Agosto {year}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Ingresos</Text>
                <Text style={[styles.summaryValue, { color: Colors.accentGreen }]}>{formatCOP(summary?.totalIncome ?? 0)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Gastos</Text>
                <Text style={[styles.summaryValue, { color: Colors.accentRed }]}>{formatCOP(summary?.totalExpense ?? 0)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Neto</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>{formatCOP(summary?.net ?? 0)}</Text>
              </View>
            </View>
            {summary?.monthlyFlow && <MonthlyChart data={summary.monthlyFlow} />}
            <View style={styles.filterRow}>
              {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
                <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.listTitle}>{transactions.length} movimiento{transactions.length !== 1 ? 's' : ''}</Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Sin movimientos este mes</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>Registrar el primero</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
      <NewTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  period: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { width: 40, height: 40, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.surfaceElevated, alignItems: 'center' },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.surfaceElevated },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  listTitle: { fontSize: 12, color: Colors.textMuted, marginHorizontal: 16, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.4)' },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  txNote: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  fab: { position: 'absolute', bottom: 88, right: 20, width: 52, height: 52, backgroundColor: Colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
