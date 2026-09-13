import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@constants/colors';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps {
  label: string; onPress: () => void; variant?: Variant;
  loading?: boolean; disabled?: boolean; style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={isDisabled} activeOpacity={0.8}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : Colors.primary} />
        : <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primary: { backgroundColor: Colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '600' },
  primaryText: { color: '#fff' },
  outlineText: { color: Colors.primary },
  ghostText: { color: Colors.textSecondary },
});
