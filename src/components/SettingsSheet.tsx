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
  onClearData?: () => void;
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

export default function SettingsSheet({ visible, onClose, settings, onSettingsChange, workouts, onClearData }: SettingsSheetProps) {
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

  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const totalSets = workouts.reduce((sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets.length, 0), 0);

  const handleClearData = () => {
    if (Platform.OS === 'web') {
      if (confirm('Delete ALL workout data? This cannot be undone.')) {
        if (confirm('Are you absolutely sure? All workouts will be permanently deleted.')) {
          onClearData?.();
          onClose();
        }
      }
    } else {
      Alert.alert(
        'Delete all data',
        'This will permanently delete all your workout data. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete everything',
            style: 'destructive',
            onPress: () => {
              onClearData?.();
              onClose();
            },
          },
        ]
      );
    }
  };

  const handleExportCSV = () => {
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

  const handleExportJSON = () => {
    if (Platform.OS === 'web') {
      const data = JSON.stringify(workouts, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymchat-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', `${workouts.length} workouts ready for export. JSON sharing coming soon.`);
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

            {/* Data section */}
            <View style={styles.dataSection}>
              <Text style={styles.dataSummary}>
                {workouts.length} workouts · {totalExercises} exercises · {totalSets} sets
              </Text>
            </View>

            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportJSON}>
                <Text style={styles.exportBtnText}>Backup JSON</Text>
              </TouchableOpacity>
            </View>

            {onClearData && workouts.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
                <Text style={styles.clearBtnText}>Clear all data</Text>
              </TouchableOpacity>
            )}

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
  dataSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dataSummary: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  clearBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.redMuted,
  },
  clearBtnText: {
    color: colors.red,
    fontSize: fontSize.sm,
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
