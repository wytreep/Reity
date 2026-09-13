import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '@constants/colors';
import { formatCOP } from '@constants/config';
import { useInflationCurrent, usePurchasingPower } from '@features/inflation/hooks/useInflation';
import { useTransactionSummary } from '@features/transactions/hooks/useTransactions';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function InflationScreen() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: ipc, isLoading, refetch: refetchIpc } = useInflationCurrent();
  const { data: summary } = useTransactionSummary(month, year);
  const balance = summary?.net ?? 0;
  const { data: power, refetch: refetchPower } = usePurchasingPower(balance);

  const refetch = () => { refetchIpc(); refetchPower(); };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Inflación COP</Text>
          <Text style={styles.subtitle}>Datos: DANE · Banco de la República</Text>
        </View>

        {/* IPC Card */}
        <View style={styles.ipcCard}>
          <Text style={styles.ipcLabel}>IPC anual Colombia</Text>
          <Text style={styles.ipcValue}>+{ipc?.ipcAnnual?.toFixed(1) ?? '—'}%</Text>
          <Text style={styles.ipcPeriod}>
            {ipc ? `${MONTH_NAMES[ipc.month - 1]} ${ipc.year}` : 'Cargando...'}{' · Fuente: DANE'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>IPC mensual</Text>
              <Text style={[styles.statValue, { color: Colors.accentRed }]}>+{ipc?.ipcMonthly?.toFixed(2) ?? '—'}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Meta Banrep</Text>
              <Text style={[styles.statValue, { color: Colors.accentAmber }]}>3.00%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Desviación</Text>
              <Text style={[styles.statValue, { color: Colors.accentRed }]}>+{power?.deviation?.toFixed(1) ?? '—'}pp</Text>
            </View>
          </View>
        </View>

        {/* Poder adquisitivo */}
        {power && balance > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Tus ahorros ajustados</Text>
            <View style={styles.adjustRow}>
              <Text style={styles.adjustLabel}>Balance nominal</Text>
              <Text style={styles.adjustValue}>{formatCOP(power.nominalBalance)}</Text>
            </View>
            <View style={styles.adjustRow}>
              <Text style={styles.adjustLabel}>Pérdida por inflación</Text>
              <Text style={[styles.adjustValue, { color: Colors.accentRed }]}>-{formatCOP(power.annualLoss)}</Text>
            </View>
            <View style={[styles.adjustRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.adjustLabel, { color: Colors.textPrimary, fontWeight: '600' }]}>Poder adquisitivo real</Text>
              <Text style={[styles.adjustValue, { color: Colors.accentGreen }]}>{formatCOP(power.realValue)}</Text>
            </View>
            <View style={styles.dailyAlert}>
              <Text style={styles.dailyAlertText}>
                📉 Tu dinero pierde{' '}
                <Text style={{ fontWeight: '700', color: Colors.accentRed }}>{formatCOP(power.dailyLoss)}/día</Text>
                {' '}por la inflación actual.
              </Text>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 ¿Qué significa?</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📈</Text>
            <Text style={styles.infoText}>
              El IPC mide cuánto suben los precios. Con un IPC de{' '}
              <Text style={{ color: Colors.accentRed, fontWeight: '600' }}>{ipc?.ipcAnnual?.toFixed(1) ?? '6.8'}%</Text>
              , lo que costaba $100.000 hace un año hoy cuesta más.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏦</Text>
            <Text style={styles.infoText}>
              El Banco de la República tiene una meta de{' '}
              <Text style={{ color: Colors.accentAmber, fontWeight: '600' }}>3%</Text>.
              Estamos por encima de esa meta.
            </Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Para proteger tu dinero considera CDTs, fondos de inversión o activos reales que superen la inflación.
            </Text>
          </View>
        </View>

        {/* Tabla de referencia */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Pérdida de valor por monto</Text>
          {[100000, 500000, 1000000, 5000000].map((amt) => {
            const annualLoss = ipc ? Math.round(amt * (ipc.ipcAnnual / 100)) : 0;
            const dailyLoss = Math.round(annualLoss / 365);
            return (
              <View key={amt} style={styles.tableRow}>
                <Text style={styles.tableAmount}>{formatCOP(amt)}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.tableValue, { color: Colors.accentRed }]}>-{formatCOP(annualLoss)}/año</Text>
                  <Text style={styles.tableDaily}>-{formatCOP(dailyLoss)}/día</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingBottom: 100 },
  header: { padding: 20, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  ipcCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surfaceCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  ipcLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  ipcValue: { fontSize: 40, fontWeight: '800', color: Colors.accentRed, letterSpacing: -2, marginBottom: 4 },
  ipcPeriod: { fontSize: 12, color: Colors.textMuted, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700' },
  card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.surfaceElevated },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  adjustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.4)' },
  adjustLabel: { fontSize: 13, color: Colors.textSecondary },
  adjustValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  dailyAlert: { marginTop: 12, padding: 10, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  dailyAlertText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  infoIcon: { fontSize: 16, width: 24 },
  infoText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.4)' },
  tableAmount: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tableValue: { fontSize: 12, fontWeight: '600' },
  tableDaily: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
});