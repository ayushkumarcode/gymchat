import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { Workout } from '../types/workout';

interface WeeklyChartProps {
  workouts: Workout[];
}

function getWeekLabel(date: Date): string {
  const month = date.toLocaleString('default', { month: 'short' });
  return `${month} ${date.getDate()}`;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export default function WeeklyChart({ workouts }: WeeklyChartProps) {
  // Compute weekly sets for last 8 weeks
  const weeks: { label: string; sets: number; workouts: number }[] = [];
  const today = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = getMonday(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    const endStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;

    let totalSets = 0;
    let workoutCount = 0;
    for (const w of workouts) {
      if (w.date >= startStr && w.date <= endStr) {
        workoutCount++;
        totalSets += w.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => !s.isWarmup).length, 0);
      }
    }

    weeks.push({
      label: getWeekLabel(weekStart),
      sets: totalSets,
      workouts: workoutCount,
    });
  }

  const maxSets = Math.max(...weeks.map(w => w.sets), 1);

  // Don't show if no data at all
  if (weeks.every(w => w.sets === 0)) return null;

  return (
    <View style={styles.container}>
      {weeks.map((week, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.label}>{week.label}</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.bar,
                {
                  width: `${(week.sets / maxSets) * 100}%`,
                  backgroundColor: week.sets > 0 ? colors.accent : 'transparent',
                },
              ]}
            />
          </View>
          <Text style={styles.value}>
            {week.sets > 0 ? `${week.sets}` : '–'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  label: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    width: 52,
    fontVariant: ['tabular-nums'],
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
    minWidth: 2,
  },
  value: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    width: 28,
    textAlign: 'right',
  },
});
