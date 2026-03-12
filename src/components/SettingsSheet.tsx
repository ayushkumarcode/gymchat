import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, fontSize } from '../utils/theme';
import { AppSettings, saveSettings } from '../utils/storage';
import { Workout } from '../types/workout';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  workouts: Workout[];
}

function workoutsToCSV(workouts: Workout[]): string {
  const rows: string[] = ['Date,Label,Exercise,Variant,Set,Reps,Weight,Unit,Warmup'];

  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        rows.push(
          [
            w.date,
            w.label || '',
            ex.name,
            ex.variant || '',
            s.setNumber,
            s.reps,
            s.weight,
            ex.weightUnit,
            s.isWarmup ? 'yes' : 'no',
          ].join(',')
        );
      }
    }
  }

  return rows.join('\n');
}

export default function SettingsSheet({ visible, onClose, settings, onSettingsChange, workouts }: SettingsSheetProps) {
  const [name, setName] = useState(settings.userName);
  const [unit, setUnit] = useState(settings.weightUnit);

  useEffect(() => {
    setName(settings.userName);
    setUnit(settings.weightUnit);
  }, [settings]);

  const handleSave = () => {
    const updated = { ...settings, userName: name, weightUnit: unit };
    onSettingsChange(updated);
    saveSettings(updated);
    onClose();
  };

  const handleExport = () => {
    const csv = workoutsToCSV(workouts);
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymchat-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', `${workouts.length} workouts ready for export. CSV sharing coming soon.`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheetOuter}>
          <BlurView intensity={40} tint="dark" style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>Settings</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Weight unit</Text>
              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, unit === 'lb' && styles.unitBtnActive]}
                  onPress={() => setUnit('lb')}
                >
                  <Text style={[styles.unitBtnText, unit === 'lb' && styles.unitBtnTextActive]}>lb</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
                  onPress={() => setUnit('kg')}
                >
                  <Text style={[styles.unitBtnText, unit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Text style={styles.exportBtnText}>Export data (CSV)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheetOuter: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  textInput: {
    color: colors.text,
    fontSize: fontSize.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    width: 180,
    textAlign: 'right',
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: colors.accent,
  },
  unitBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  unitBtnTextActive: {
    color: colors.bg,
  },
  exportBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
