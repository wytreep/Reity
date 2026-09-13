import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

export default function InflationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Inflación — Sprint 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  text: { color: Colors.textSecondary, fontSize: 16 },
});
