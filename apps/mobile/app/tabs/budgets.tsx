import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { formatCOP } from '@constants/config';
import { useBudgets, useDeleteBudget } from '@features/budgets/hooks/useBudgets';
import { NewBudgetModal } from '@features/budgets/components/NewBudgetModal';
import { BudgetItem } from '@features/budgets/services/budgets.service';

const STATUS_CONFIG = {
  ok:       { color: Colors.accentGreen, label: 'Bien',     icon: 'checkmark-circle' },
  warning:  { color: Colors.accentAmber, label: 'Cuidado',  icon: 'warning'          },
  exceeded: { color: Colors.accentRed,   label: '¡Límite!', icon: 'close-circle'     },
} as const;

export default function BudgetsScreen() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const [modalVisible, setModalVisible] = useState(false);
  const { data, isLoading, refetch } = useBudgets(month, year);
  const deleteMutation = useDeleteBudget();
  const budgets: BudgetItem[] = data?.budgets ?? [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Eliminar', `¿Eliminar presupuesto de "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Presupuesto</Text>
            <Text style={styles.period}>{new Date(year, month - 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {data && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Ejecutado este mes</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <Text style={styles.totalPct}>{Math.round(data.totalPercentage)}%</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>{formatCOP(data.totalSpent)} de {formatCOP(data.totalBudget)}</Text>
            </View>
            <View style={styles.totalBarBg}>
              <View style={[styles.totalBarFill, { width: `${Math.min(data.totalPercentage, 100)}%`, backgroundColor: data.totalPercentage >= 100 ? Colors.accentRed : data.totalPercentage >= 80 ? Colors.accentAmber : Colors.accentGreen }]} />
            </View>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 8 }}>Disponible: {formatCOP(Math.max(data.totalBudget - data.totalSpent, 0))}</Text>
          </View>
        )}

        {budgets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 4 }}>🎯</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}>Sin presupuestos</Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>Crea límites por categoría para controlar tus gastos</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Crear primer presupuesto</Text>
            </TouchableOpacity>
          </View>
        ) : budgets.map((budget) => {
          const cfg = STATUS_CONFIG[budget.status];
          return (
            <TouchableOpacity key={budget.id} style={styles.budgetCard} onLongPress={() => handleDelete(budget.id, budget.category?.name ?? '')} activeOpacity={0.8}>
              <View style={styles.cardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.catIcon, { backgroundColor: `${budget.category?.color}22` }]}>
                    <Ionicons name={(budget.category?.icon as any) ?? 'cash-outline'} size={18} color={budget.category?.color ?? Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{budget.category?.name ?? 'Categoría'}</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{formatCOP(budget.spent)} / {formatCOP(budget.amount)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}20` }]}>
                  <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.min(budget.percentage, 100)}%`, backgroundColor: cfg.color }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={[{ fontSize: 11, fontWeight: '600' }, { color: cfg.color }]}>{budget.percentage.toFixed(1)}% usado</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted }}>Quedan {formatCOP(budget.remaining)}</Text>
              </View>
              {budget.status === 'warning' && (
                <View style={styles.alertBanner}>
                  <Ionicons name="warning-outline" size={13} color={Colors.accentAmber} />
                  <Text style={[styles.alertText, { color: Colors.accentAmber }]}>Cerca del límite</Text>
                </View>
              )}
              {budget.status === 'exceeded' && (
                <View style={[styles.alertBanner, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                  <Ionicons name="alert-circle-outline" size={13} color={Colors.accentRed} />
                  <Text style={[styles.alertText, { color: Colors.accentRed }]}>Límite alcanzado</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
      <NewBudgetModal visible={modalVisible} onClose={() => setModalVisible(false)} month={month} year={year} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  period: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  addBtn: { width: 40, height: 40, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  totalCard: { margin: 16, marginTop: 0, backgroundColor: Colors.surfaceCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.surfaceElevated },
  totalLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  totalPct: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  totalBarBg: { height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4 },
  totalBarFill: { height: 8, borderRadius: 4 },
  budgetCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.surfaceElevated },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  alertText: { fontSize: 11, flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 8 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 14 },
  fab: { position: 'absolute', bottom: 88, right: 20, width: 52, height: 52, backgroundColor: Colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
