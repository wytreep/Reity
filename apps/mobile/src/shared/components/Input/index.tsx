import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';

interface InputProps extends TextInputProps {
  label?: string; error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean; containerStyle?: ViewStyle;
}

export function Input({ label, error, leftIcon, isPassword, containerStyle, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, isFocused && styles.focused, error && styles.errorBorder]}>
        {leftIcon && <Ionicons name={leftIcon} size={18} color={isFocused ? Colors.primary : Colors.textMuted} style={styles.leftIcon} />}
        <TextInput
          style={styles.input} placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          autoCapitalize="none" {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.surfaceElevated, paddingHorizontal: 14, height: 52,
  },
  focused: { borderColor: Colors.primary },
  errorBorder: { borderColor: Colors.accentRed },
  leftIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  errorText: { color: Colors.accentRed, fontSize: 12, marginTop: 4 },
});
