import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { formatCOP } from '@constants/config';
import { useGoals, useDeleteGoal } from '@features/goals/hooks/useGoals';
import { NewGoalModal } from '@features/goals/components/NewGoalModal';
import { ContributeModal } from '@features/goals/components/ContributeModal';
import { GoalItem } from '@features/goals/services/goals.service';

const STATUS_COLORS = { active: Colors.primary, completed: Colors.accentGreen, cancelled: Colors.textMuted };
const STATUS_LABELS = { active: 'Activa', completed: '¡Completada!', cancelled: 'Cancelada' };

export default function GoalsScreen() {
  const [newModalVisible, setNewModalVisible]     = useState(false);
  const [selectedGoal, setSelectedGoal]           = useState<GoalItem | null>(null);
  const [contributeVisible, setContributeVisible] = useState(false);
  const { data: goals = [], isLoading, refetch } = useGoals();
  const deleteMutation = useDeleteGoal();
  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const handleDelete = (goal: GoalItem) => {
    Alert.alert('Eliminar', `¿Eliminar "${goal.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(goal.id) },
    ]);
  };

  const renderGoal = (goal: GoalItem) => {
    const color = STATUS_COLORS[goal.status];
    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.statusText, { color }]}>{STATUS_LABELS[goal.status]}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDelete(goal)}>
            <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <View>
            <Text style={{ fontSize: 10, color: Colors.textMuted, marginBottom: 2 }}>Acumulado</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color, letterSpacing: -0.5 }}>{formatCOP(goal.currentAmount)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted, marginBottom: 2 }}>Objetivo</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary }}>{formatCOP(goal.targetAmount)}</Text>
          </View>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${goal.progressPercentage}%`, backgroundColor: color }]} />
        </View>
        <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>{goal.progressPercentage.toFixed(1)}% · Faltan {formatCOP(goal.remaining)}</Text>
        {goal.projectedDate && goal.status === 'active' && (
          <View style={styles.projectionBadge}>
            <Ionicons name="time-outline" size={12} color={Colors.accentBlue} />
            <Text style={{ fontSize: 11, color: Colors.accentBlue, flex: 1 }}>
              Proyección: {new Date(goal.projectedDate).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        )}
        {goal.status === 'active' && (
          <TouchableOpacity style={styles.contributeBtn} onPress={() => { setSelectedGoal(goal); setContributeVisible(true); }}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1 }}>Agregar aporte</Text>
            {goal.contributionCount > 0 && <Text style={{ fontSize: 11, color: Colors.textMuted }}>{goal.contributionCount} aporte{goal.contributionCount !== 1 ? 's' : ''}</Text>}
          </TouchableOpacity>
        )}
        {goal.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.accentGreen }}>🎉 ¡Meta alcanzada!</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Metas</Text>
            <Text style={styles.subtitle}>{activeGoals.length} activa{activeGoals.length !== 1 ? 's' : ''}{completedGoals.length > 0 ? ` · ${completedGoals.length} completada${completedGoals.length !== 1 ? 's' : ''}` : ''}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setNewModalVisible(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {goals.length > 0 && (
          <View style={styles.totalCard}>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>Total ahorrado en metas</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 }}>{formatCOP(goals.reduce((s, g) => s + g.currentAmount, 0))}</Text>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>de {formatCOP(goals.reduce((s, g) => s + g.targetAmount, 0))} en objetivos totales</Text>
          </View>
        )}
        {activeGoals.length > 0 && <><Text style={styles.sectionLabel}>En progreso</Text>{activeGoals.map(renderGoal)}</>}
        {completedGoals.length > 0 && <><Text style={styles.sectionLabel}>Completadas</Text>{completedGoals.map(renderGoal)}</>}
        {goals.length === 0 && !isLoading && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 52, marginBottom: 4 }}>🏆</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}>Sin metas aún</Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>Define objetivos de ahorro y Reity te mostrará cuándo los alcanzarás</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setNewModalVisible(true)}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Crear primera meta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => setNewModalVisible(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
      <NewGoalModal visible={newModalVisible} onClose={() => setNewModalVisible(false)} />
      <ContributeModal visible={contributeVisible} onClose={() => setContributeVisible(false)} goal={selectedGoal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { width: 40, height: 40, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  totalCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: Colors.surfaceCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.surfaceElevated },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginHorizontal: 16, marginBottom: 10 },
  goalCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surfaceCard, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.surfaceElevated },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  goalName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, borderRadius: 3 },
  projectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)' },
  contributeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  completedBanner: { backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 8 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 14 },
  fab: { position: 'absolute', bottom: 88, right: 20, width: 52, height: 52, backgroundColor: Colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
