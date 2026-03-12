import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { Exercise, ExerciseSet } from '../types/workout';

interface WorkoutTableProps {
  exercise: Exercise;
  previousExercise?: Exercise; // same exercise from last session
  onUpdateSet?: (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => void;
}

export default function WorkoutTable({ exercise, previousExercise, onUpdateSet }: WorkoutTableProps) {
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

  // Compare with previous session
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {exercise.variant && (
          <Text style={styles.variant}>{exercise.variant}</Text>
        )}
        <Text style={styles.weightLabel}>
          {exercise.sets[0]?.weight > 0 ? `${exercise.sets[0].weight} ${exercise.weightUnit}` : 'BW'}
        </Text>
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
          <View key={idx} style={[styles.row, idx % 2 === 0 && styles.rowAlt]}>
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
                <Text style={styles.cell}>
                  {set.weight > 0 ? set.weight : '—'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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
    fontSize: fontSize.sm,
    marginRight: spacing.sm,
  },
  weightLabel: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '600',
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
});
