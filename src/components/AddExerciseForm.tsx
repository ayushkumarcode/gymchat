import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { Exercise, ExerciseSet } from '../types/workout';

interface AddExerciseFormProps {
  onAdd: (exercise: Exercise) => void;
  onCancel: () => void;
}

export default function AddExerciseForm({ onAdd, onCancel }: AddExerciseFormProps) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const nameRef = useRef<TextInput>(null);

  const handleAdd = () => {
    if (!name.trim()) return;

    const setCount = parseInt(sets, 10) || 3;
    const repCount = parseInt(reps, 10) || 10;
    const weightNum = parseInt(weight, 10) || 0;

    const exerciseSets: ExerciseSet[] = Array.from({ length: setCount }, (_, i) => ({
      setNumber: i + 1,
      reps: repCount,
      weight: weightNum,
    }));

    const exercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      sets: exerciseSets,
      weightUnit: 'lb',
    };

    onAdd(exercise);
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={nameRef}
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Exercise name"
        placeholderTextColor={colors.textTertiary}
        autoFocus
      />

      <View style={styles.fieldsRow}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Sets</Text>
          <TextInput
            style={styles.fieldInput}
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
            selectTextOnFocus
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Reps</Text>
          <TextInput
            style={styles.fieldInput}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            selectTextOnFocus
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Weight</Text>
          <TextInput
            style={styles.fieldInput}
            value={weight}
            onChangeText={setWeight}
            placeholder="BW"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            selectTextOnFocus
          />
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim()}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  nameInput: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  fieldInput: {
    color: colors.text,
    fontSize: fontSize.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  addBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: colors.bg,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
