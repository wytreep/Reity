import { View, TextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';

interface CurrencyInputProps {
  value: number; onChange: (v: number) => void;
  containerStyle?: ViewStyle; error?: string;
}

export function CurrencyInput({ value, onChange, containerStyle, error }: CurrencyInputProps) {
  const [display, setDisplay] = useState(value > 0 ? formatCOP(value) : '');

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const number = parseInt(digits || '0', 10);
    onChange(number);
    setDisplay(digits ? formatCOP(number) : '');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.symbol}>$</Text>
      <TextInput
        style={styles.input} value={display} onChangeText={handleChange}
        keyboardType="numeric" placeholder="0" placeholderTextColor={Colors.textMuted}
      />
      <Text style={styles.currency}>COP</Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

import { useState } from 'react';
function formatCOP(n: number) { return n.toLocaleString('es-CO'); }

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1.5, borderColor: Colors.surfaceElevated, gap: 8,
  },
  symbol: { fontSize: 22, fontWeight: '700', color: Colors.textSecondary },
  input: { flex: 1, fontSize: 32, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', letterSpacing: -1 },
  currency: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  error: { color: Colors.accentRed, fontSize: 12, marginTop: 4 },
});
