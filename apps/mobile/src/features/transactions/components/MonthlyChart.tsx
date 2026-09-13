import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface MonthlyFlowItem { label: string; income: number; expense: number; }
interface Props { data: MonthlyFlowItem[]; }

const CHART_HEIGHT = 80;

export function MonthlyChart({ data }: Props) {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const barHeight = (v: number) => Math.max((v / maxValue) * CHART_HEIGHT, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flujo mensual</Text>
      <View style={styles.chart}>
        {data.map((item, i) => (
          <View key={i} style={styles.barGroup}>
            <View style={styles.bars}>
              <View style={[styles.bar, styles.incomeBar, { height: barHeight(item.income) }]} />
              <View style={[styles.bar, styles.expenseBar, { height: barHeight(item.expense) }]} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.accentGreen }]} /><Text style={styles.legendText}>Ingresos</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.accentRed }]} /><Text style={styles.legendText}>Gastos</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.surfaceElevated },
  title: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: CHART_HEIGHT + 20 },
  barGroup: { flex: 1, alignItems: 'center', gap: 6 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: CHART_HEIGHT },
  bar: { width: 10, borderRadius: 4, minHeight: 3 },
  incomeBar: { backgroundColor: Colors.accentGreen, opacity: 0.85 },
  expenseBar: { backgroundColor: Colors.accentRed, opacity: 0.85 },
  label: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary },
});
