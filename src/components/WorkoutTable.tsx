import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { Exercise, ExerciseSet } from '../types/workout';

interface WorkoutTableProps {
  exercise: Exercise;
  previousExercise?: Exercise;
  prWeight?: number;
  onUpdateSet?: (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => void;
  onAddSet?: (exerciseId: string) => void;
  onDeleteSet?: (exerciseId: string, setIndex: number) => void;
  onDeleteExercise?: (exerciseId: string) => void;
}

export default function WorkoutTable({ exercise, previousExercise, prWeight, onUpdateSet, onAddSet, onDeleteSet, onDeleteExercise }: WorkoutTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (setIndex: number, field: 'reps' | 'weight', currentValue: number) => {
    const key = `${setIndex}-${field}`;
    setEditingCell(key);
    setEditValue(String(currentValue));
  };

  const handleEndEdit = (setIndex: number, field: 'reps' | 'weight') => {
    const numValue = parseInt(editValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && onUpdateSet) {
      onUpdateSet(exercise.id, setIndex, field, numValue);
    }
    setEditingCell(null);
  };

  const getPrevSet = (setIndex: number): ExerciseSet | undefined => {
    return previousExercise?.sets[setIndex];
  };

  const getRepsDelta = (setIndex: number, currentReps: number): string | null => {
    const prev = getPrevSet(setIndex);
    if (!prev) return null;
    const diff = currentReps - prev.reps;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return null;
  };

  const handleLongPress = (setIndex: number) => {
    if (!onDeleteSet) return;
    if (Platform.OS === 'web') {
      if (confirm('Delete this set?')) {
        onDeleteSet(exercise.id, setIndex);
      }
    } else {
      Alert.alert('Delete set', 'Remove this set?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteSet(exercise.id, setIndex) },
      ]);
    }
  };

  const handleDeleteExercise = () => {
    if (!onDeleteExercise) return;
    if (Platform.OS === 'web') {
      if (confirm(`Delete ${exercise.name}?`)) {
        onDeleteExercise(exercise.id);
      }
    } else {
      Alert.alert('Delete exercise', `Remove ${exercise.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteExercise(exercise.id) },
      ]);
    }
  };

  // Compute estimated 1RM from heaviest working set (Epley formula)
  const estimated1RM = (() => {
    let best = 0;
    for (const s of exercise.sets) {
      if (s.isWarmup || s.weight <= 0) continue;
      const e1rm = s.reps === 1 ? s.weight : Math.round(s.weight * (1 + s.reps / 30));
      if (e1rm > best) best = e1rm;
    }
    return best;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseName}>
          {exercise.name}
          {exercise.variant ? <Text style={styles.variant}> {exercise.variant}</Text> : null}
        </Text>
        <View style={styles.headerRight}>
          {estimated1RM > 0 && (
            <Text style={styles.e1rmLabel}>e1RM {estimated1RM}</Text>
          )}
          <Text style={styles.weightLabel}>
            {exercise.sets[0]?.weight > 0 ? `${exercise.sets[0].weight} ${exercise.weightUnit}` : 'BW'}
          </Text>
          {onDeleteExercise && (
            <TouchableOpacity onPress={handleDeleteExercise} style={styles.deleteExBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.deleteExIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.colHeader, styles.colSet]}>Set</Text>
        <Text style={[styles.colHeader, styles.colReps]}>Reps</Text>
        <Text style={[styles.colHeader, styles.colWeight]}>Weight</Text>
      </View>

      {exercise.sets.map((set, idx) => {
        const repsDelta = getRepsDelta(idx, set.reps);
        const repsKey = `${idx}-reps`;
        const weightKey = `${idx}-weight`;

        return (
          <TouchableOpacity
            key={idx}
            onLongPress={() => handleLongPress(idx)}
            delayLongPress={500}
            activeOpacity={0.7}
          >
            <View style={[styles.row, idx % 2 === 0 && styles.rowAlt]}>
              <Text style={[styles.cell, styles.colSet, styles.setNum]}>
                {set.isWarmup ? 'W' : set.setNumber}
              </Text>

              {editingCell === repsKey ? (
                <TextInput
                  style={[styles.cellInput, styles.colReps]}
                  value={editValue}
                  onChangeText={setEditValue}
                  onBlur={() => handleEndEdit(idx, 'reps')}
                  onSubmitEditing={() => handleEndEdit(idx, 'reps')}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity
                  style={styles.colReps}
                  onPress={() => handleStartEdit(idx, 'reps', set.reps)}
                >
                  <View style={styles.repsCell}>
                    <Text style={styles.cell}>{set.reps}</Text>
                    {repsDelta && (
                      <Text style={[
                        styles.delta,
                        repsDelta.startsWith('+') ? styles.deltaUp : styles.deltaDown,
                      ]}>
                        {repsDelta}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}

              {editingCell === weightKey ? (
                <TextInput
                  style={[styles.cellInput, styles.colWeight]}
                  value={editValue}
                  onChangeText={setEditValue}
                  onBlur={() => handleEndEdit(idx, 'weight')}
                  onSubmitEditing={() => handleEndEdit(idx, 'weight')}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity
                  style={styles.colWeight}
                  onPress={() => handleStartEdit(idx, 'weight', set.weight)}
                >
                  <View style={styles.weightCell}>
                    <Text style={styles.cell}>
                      {set.weight > 0 ? set.weight : '-'}
                    </Text>
                    {!set.isWarmup && set.weight > 0 && prWeight !== undefined && set.weight >= prWeight && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prText}>PR</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Add set button */}
      {onAddSet && (
        <TouchableOpacity style={styles.addSetBtn} onPress={() => onAddSet(exercise.id)}>
          <Text style={styles.addSetText}>+ Add set</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  variant: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  e1rmLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  weightLabel: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  deleteExBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteExIcon: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: -1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colHeader: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  colSet: { width: 40 },
  colReps: { width: 80 },
  colWeight: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowAlt: {
    backgroundColor: colors.surfaceLight,
  },
  cell: {
    color: colors.text,
    fontSize: fontSize.md,
    fontVariant: ['tabular-nums'],
  },
  cellInput: {
    color: colors.text,
    fontSize: fontSize.md,
    backgroundColor: colors.bg,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent,
    minWidth: 50,
  },
  setNum: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  repsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  delta: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  deltaUp: {
    color: colors.accent,
  },
  deltaDown: {
    color: colors.red,
  },
  weightCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  prText: {
    color: '#EAB308',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addSetBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addSetText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
});
