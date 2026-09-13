import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { formatCOP } from '@constants/config';
import { useAuthStore } from '@shared/store/auth.store';
import { useTransactionSummary } from '@features/transactions/hooks/useTransactions';
import { NewTransactionModal } from '@features/transactions/components/NewTransactionModal';
import { Transaction } from '@shared/types';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const { data: summary, isLoading, refetch } = useTransactionSummary(month, year);
  const recentTx: Transaction[] = (summary?.transactions ?? []).slice(0, 5);
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.name}>{user?.fullName ?? 'Usuario'}</Text>
          </View>
          <View style={styles.avatarBtn}>
            <Text style={styles.avatarText}>{(user?.fullName ?? 'U')[0].toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance disponible</Text>
          <Text style={styles.balanceAmount}>{formatCOP(summary?.net ?? 0)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Ingresos</Text>
              <Text style={[styles.balanceStatVal, { color: '#6EE7B7' }]}>+{formatCOP(summary?.totalIncome ?? 0)}</Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Gastos</Text>
              <Text style={[styles.balanceStatVal, { color: '#FCA5A5' }]}>-{formatCOP(summary?.totalExpense ?? 0)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.inflationWidget} onPress={() => router.push('/(tabs)/inflation')}>
          <Ionicons name="trending-up" size={24} color={Colors.accentRed} />
          <View style={{ flex: 1 }}>
            <Text style={styles.inflationTitle}>IPC Colombia</Text>
            <Text style={styles.inflationDesc}>Tu dinero pierde valor diariamente</Text>
          </View>
          <View style={styles.inflationBadge}><Text style={styles.inflationBadgeText}>+6.8%</Text></View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.quickRow}>
          {[
            { icon: 'add-circle-outline', label: 'Nuevo', action: () => setModalVisible(true) },
            { icon: 'swap-horizontal-outline', label: 'Historial', action: () => router.push('/(tabs)/transactions') },
            { icon: 'pie-chart-outline', label: 'Presupuesto', action: () => router.push('/(tabs)/budgets') },
            { icon: 'flag-outline', label: 'Metas', action: () => router.push('/(tabs)/goals') },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickBtn} onPress={item.action}>
              <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recientes</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={{ fontSize: 12, color: Colors.primary }}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {recentTx.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Sin movimientos este mes</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>Registrar el primero</Text>
            </TouchableOpacity>
          </View>
        ) : recentTx.map((tx) => (
          <View key={tx.id} style={styles.txItem}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name={(tx.category?.icon as any) ?? 'cash-outline'} size={18} color={tx.type === 'income' ? Colors.accentGreen : Colors.accentRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txName}>{tx.category?.name ?? 'Sin categoría'}</Text>
              <Text style={styles.txDate}>{tx.note ?? tx.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'income' ? Colors.accentGreen : Colors.accentRed }]}>
              {tx.type === 'income' ? '+' : '-'}{formatCOP(Number(tx.amount))}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
      <NewTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  avatarBtn: { width: 40, height: 40, backgroundColor: Colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  balanceCard: { margin: 16, marginTop: 0, backgroundColor: Colors.primary, borderRadius: 20, padding: 20 },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceAmount: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  balanceRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  balanceStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 },
  balanceStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  balanceStatVal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  inflationWidget: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 20, backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.surfaceElevated },
  inflationTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  inflationDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  inflationBadge: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  inflationBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.accentRed },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginLeft: 16, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 16 },
  quickRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.surfaceElevated },
  quickLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.4)' },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  txDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  fab: { position: 'absolute', bottom: 88, right: 20, width: 52, height: 52, backgroundColor: Colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
